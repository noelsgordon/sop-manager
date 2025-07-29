import os
import time
from datetime import datetime, timezone
from supabase import create_client, Client
from urllib.parse import quote

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

BUCKET_NAME = "part-images"
TABLE_NAME = "part_images"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_all_bucket_files_with_pagination():
    """Get all files from bucket using proper pagination with options."""
    print("📋 Getting all bucket files with pagination...")
    all_files = []
    offset = 0
    limit = 100
    
    bucket = supabase.storage.from_(BUCKET_NAME)
    
    while True:
        try:
            # Create options object for pagination
            options = {
                'limit': limit,
                'offset': offset,
                'sortBy': {'column': 'name', 'order': 'asc'}
            }
            
            # Get files with pagination
            files = bucket.list(options=options)
            
            if not files:
                print(f"   No more files found at offset {offset}")
                break
            
            all_files.extend(files)
            print(f"   Retrieved {len(files)} files at offset {offset} (total: {len(all_files)})")
            
            # If we got fewer files than the limit, we've reached the end
            if len(files) < limit:
                print(f"   Reached end of files (got {len(files)} < {limit})")
                break
            
            offset += limit
            time.sleep(0.1)  # Small delay to avoid rate limiting
            
        except Exception as e:
            print(f"❌ Error getting files at offset {offset}: {e}")
            break
    
    print(f"📊 Total files retrieved: {len(all_files)}")
    return all_files


def get_all_database_records():
    """Get all records from the database using pagination."""
    print("📋 Getting all database records with pagination...")
    all_records = []
    offset = 0
    limit = 1000
    
    while True:
        try:
            result = supabase.table(TABLE_NAME).select("*").range(offset, offset + limit - 1).execute()
            
            if not result.data:
                print(f"   No more records found at offset {offset}")
                break
                
            all_records.extend(result.data)
            print(f"   Retrieved {len(result.data)} records at offset {offset} (total: {len(all_records)})")
            
            if len(result.data) < limit:
                print(f"   Reached end of records (got {len(result.data)} < {limit})")
                break
                
            offset += limit
            time.sleep(0.1)  # Small delay to avoid rate limiting
            
        except Exception as e:
            print(f"❌ Error fetching records at offset {offset}: {e}")
            break
    
    print(f"📊 Total database records: {len(all_records)}")
    return all_records


def sync_bucket_files_to_database():
    """Sync all bucket files to the database table."""
    print("🔄 Syncing bucket files to database...")
    print("=" * 50)
    
    # Get all bucket files
    bucket_files = get_all_bucket_files_with_pagination()
    
    if not bucket_files:
        print("❌ No files found in bucket")
        return
    
    # Filter for image files
    image_files = [f for f in bucket_files if f["name"].lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))]
    print(f"🖼️ Found {len(image_files)} image files")
    
    # Get existing database records
    existing_records = get_all_database_records()
    existing_file_names = {record["file_name"] for record in existing_records if record.get("file_name")}
    
    # Find files that need to be added to database
    files_to_add = []
    for file_info in image_files:
        file_name = file_info["name"]
        if file_name not in existing_file_names:
            # Extract part number from file name
            part_number = os.path.splitext(file_name)[0]  # remove extension
            
            # Construct public URL
            encoded_file = quote(file_name)
            url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{encoded_file}"
            
            files_to_add.append({
                "part_number": part_number,
                "file_name": file_name,
                "url": url,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    print(f"📊 SYNC ANALYSIS:")
    print(f"   • Total image files in bucket: {len(image_files)}")
    print(f"   • Existing database records: {len(existing_records)}")
    print(f"   • Files to add to database: {len(files_to_add)}")
    
    if not files_to_add:
        print("✅ All files are already in the database!")
        return
    
    # Add new files to database
    print(f"\n📋 Adding {len(files_to_add)} files to database...")
    added_count = 0
    failed_count = 0
    
    for i, record in enumerate(files_to_add, 1):
        try:
            # Insert the record
            supabase.table(TABLE_NAME).upsert(record, on_conflict="part_number").execute()
            print(f"   ✅ Added: {record['file_name']}")
            added_count += 1
            
            # Small delay to avoid rate limiting
            if i % 10 == 0:
                time.sleep(0.1)
                
        except Exception as e:
            print(f"   ❌ Failed to add {record['file_name']}: {e}")
            failed_count += 1
    
    print(f"\n📊 DATABASE SYNC SUMMARY:")
    print(f"   • Successfully added: {added_count}")
    print(f"   • Failed additions: {failed_count}")
    
    return added_count, failed_count


def update_signed_urls():
    """Update signed URLs for all database records."""
    print("🔗 Updating signed URLs for all records...")
    print("=" * 50)
    
    # Get all database records
    all_records = get_all_database_records()
    
    if not all_records:
        print("❌ No records found in database")
        return
    
    print(f"📋 Updating {len(all_records)} records with signed URLs...")
    
    updated_count = 0
    failed_count = 0
    
    for i, record in enumerate(all_records, 1):
        try:
            file_name = record["file_name"]
            
            # Generate signed URL
            signed_url_result = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 3600)  # 1 hour expiry
            
            if signed_url_result and signed_url_result.get("signedURL"):
                signed_url = signed_url_result["signedURL"]
                
                # Update the record with signed URL
                supabase.table(TABLE_NAME).update({
                    "signed_url": signed_url,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("file_name", file_name).execute()
                
                print(f"   ✅ Updated: {file_name}")
                updated_count += 1
            else:
                print(f"   ⚠️ No signed URL generated for: {file_name}")
                failed_count += 1
            
            # Small delay to avoid rate limiting
            if i % 10 == 0:
                time.sleep(0.1)
                
        except Exception as e:
            print(f"   ❌ Failed to update {record.get('file_name', 'unknown')}: {e}")
            failed_count += 1
    
    print(f"\n📊 SIGNED URL UPDATE SUMMARY:")
    print(f"   • Successfully updated: {updated_count}")
    print(f"   • Failed updates: {failed_count}")
    
    return updated_count, failed_count


def verify_sync_status():
    """Verify the sync status between bucket and database."""
    print("🔍 Verifying sync status...")
    print("=" * 40)
    
    # Get all bucket files
    bucket_files = get_all_bucket_files_with_pagination()
    bucket_image_files = [f["name"] for f in bucket_files if f["name"].lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))]
    
    # Get all database records
    db_records = get_all_database_records()
    db_file_names = {record["file_name"] for record in db_records if record.get("file_name")}
    
    # Find missing files
    missing_in_db = set(bucket_image_files) - db_file_names
    orphaned_in_db = db_file_names - set(bucket_image_files)
    
    # Check signed URLs
    records_with_signed_urls = [r for r in db_records if r.get("signed_url")]
    
    print(f"📊 VERIFICATION RESULTS:")
    print(f"   • Total image files in bucket: {len(bucket_image_files)}")
    print(f"   • Total records in database: {len(db_records)}")
    print(f"   • Records with signed URLs: {len(records_with_signed_urls)}")
    print(f"   • Missing in database: {len(missing_in_db)}")
    print(f"   • Orphaned in database: {len(orphaned_in_db)}")
    
    if missing_in_db:
        print(f"   ⚠️ Files missing from database:")
        for file_name in list(missing_in_db)[:10]:
            print(f"      • {file_name}")
        if len(missing_in_db) > 10:
            print(f"      ... and {len(missing_in_db) - 10} more")
    
    if orphaned_in_db:
        print(f"   ⚠️ Orphaned database records:")
        for file_name in list(orphaned_in_db)[:10]:
            print(f"      • {file_name}")
        if len(orphaned_in_db) > 10:
            print(f"      ... and {len(orphaned_in_db) - 10} more")
    
    sync_percentage = (len(db_file_names) / len(bucket_image_files) * 100) if bucket_image_files else 0
    signed_url_percentage = (len(records_with_signed_urls) / len(db_records) * 100) if db_records else 0
    
    print(f"\n📊 SYNC PERCENTAGES:")
    print(f"   • Database sync: {sync_percentage:.1f}%")
    print(f"   • Signed URL coverage: {signed_url_percentage:.1f}%")
    
    return len(missing_in_db) == 0 and len(orphaned_in_db) == 0 and signed_url_percentage == 100


def main():
    """Main function to sync bucket files with database and add signed URLs."""
    print("🚀 SOP Manager - Comprehensive Image Sync with Pagination")
    print("=" * 70)
    
    # Step 1: Sync bucket files to database
    print("\n📋 Step 1: Syncing bucket files to database...")
    added_count, failed_count = sync_bucket_files_to_database()
    
    # Step 2: Update signed URLs
    print(f"\n📋 Step 2: Updating signed URLs...")
    updated_count, failed_url_count = update_signed_urls()
    
    # Step 3: Verify sync status
    print(f"\n📋 Step 3: Verifying sync status...")
    sync_successful = verify_sync_status()
    
    print("\n" + "=" * 70)
    if sync_successful:
        print("✅ Comprehensive sync completed successfully!")
        print(f"   • Added {added_count} new files to database")
        print(f"   • Updated {updated_count} records with signed URLs")
        print(f"   • Failed additions: {failed_count}")
        print(f"   • Failed URL updates: {failed_url_count}")
    else:
        print("⚠️ Sync completed with some issues")
        print(f"   • Added {added_count} new files to database")
        print(f"   • Updated {updated_count} records with signed URLs")
        print(f"   • Failed additions: {failed_count}")
        print(f"   • Failed URL updates: {failed_url_count}")
        print(f"   • Some files may need manual attention")


if __name__ == "__main__":
    main() 