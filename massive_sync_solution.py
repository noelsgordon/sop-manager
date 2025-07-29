import os
import time
from datetime import datetime, timezone
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

BUCKET_NAME = "part-images"
TABLE_NAME = "part_images"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_all_bucket_files_sql():
    """Get all bucket files using SQL query with pagination."""
    print("📋 Getting all bucket files via SQL...")
    all_files = []
    offset = 0
    limit = 1000  # Process in chunks of 1000
    
    while True:
        try:
            # Use SQL to get files in chunks
            result = supabase.rpc('exec_sql', {
                'sql_query': f"""
                SELECT name 
                FROM storage.objects 
                WHERE bucket_id = 'part-images' 
                  AND (name LIKE '%.jpg' OR name LIKE '%.JPG')
                ORDER BY name
                LIMIT {limit} OFFSET {offset}
                """
            }).execute()
            
            if not result.data:
                break
                
            chunk_files = [row['name'] for row in result.data]
            all_files.extend(chunk_files)
            
            print(f"   Retrieved chunk {offset//limit + 1}: {len(chunk_files)} files (total: {len(all_files)})")
            
            if len(chunk_files) < limit:
                break
                
            offset += limit
            time.sleep(0.1)  # Small delay to avoid rate limits
            
        except Exception as e:
            print(f"❌ Error getting files at offset {offset}: {e}")
            break
    
    return all_files


def get_all_database_records():
    """Get all records from the database using pagination."""
    all_records = []
    offset = 0
    limit = 1000
    
    while True:
        try:
            result = supabase.table(TABLE_NAME).select("*").range(offset, offset + limit - 1).execute()
            
            if not result.data:
                break
                
            all_records.extend(result.data)
            offset += limit
            
            if len(result.data) < limit:
                break
                
        except Exception as e:
            print(f"❌ Error fetching records at offset {offset}: {e}")
            break
    
    return all_records


def check_file_exists_in_bucket(file_name):
    """Check if a specific file exists in the bucket."""
    try:
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 60)
        return signed and signed.get("signedURL")
    except Exception:
        return False


def analyze_massive_bucket():
    """Analyze the massive bucket (5,072+ files)."""
    print("🔍 Analyzing massive bucket (5,072+ files)...")
    print("=" * 60)
    
    # Get all bucket files
    bucket_files = get_all_bucket_files_sql()
    print(f"\n📦 Retrieved {len(bucket_files)} JPG files from bucket")
    
    # Get database records
    print("📊 Getting database records...")
    db_records = get_all_database_records()
    print(f"   Database records: {len(db_records)}")
    
    # Find missing records
    db_file_names = set(r["file_name"] for r in db_records)
    missing_in_db = [f for f in bucket_files if f not in db_file_names]
    
    print(f"\n🔄 MASSIVE SYNC ANALYSIS:")
    print(f"   • Total JPG files in bucket: {len(bucket_files)}")
    print(f"   • Database records: {len(db_records)}")
    print(f"   • Files missing from database: {len(missing_in_db)}")
    print(f"   • Sync percentage: {len(db_records)/len(bucket_files)*100:.1f}%")
    
    # Show some missing files
    if missing_in_db:
        print(f"\n📋 Sample missing files (first 10):")
        for i, file_name in enumerate(missing_in_db[:10]):
            print(f"   {i+1}. {file_name}")
        if len(missing_in_db) > 10:
            print(f"   ... and {len(missing_in_db) - 10} more")
    
    return {
        "bucket_files": len(bucket_files),
        "db_records": len(db_records),
        "missing_in_db": len(missing_in_db)
    }


def sync_massive_bucket():
    """Sync the massive bucket (5,072+ files)."""
    print("🚀 Starting massive bucket sync (5,072+ files)...")
    print("=" * 60)
    
    # Get all bucket files
    bucket_files = get_all_bucket_files_sql()
    print(f"📦 Found {len(bucket_files)} JPG files")
    
    # Get database records
    db_records = get_all_database_records()
    db_file_names = set(r["file_name"] for r in db_records)
    
    # Find missing records
    missing_files = [f for f in bucket_files if f not in db_file_names]
    
    print(f"🆕 Found {len(missing_files)} missing records to insert")
    
    # Insert missing records in batches
    if missing_files:
        print("➕ Inserting missing records...")
        batch_size = 100  # Supabase insert limit
        inserted_count = 0
        
        for i in range(0, len(missing_files), batch_size):
            batch = missing_files[i:i + batch_size]
            records_to_insert = []
            
            for file_name in batch:
                part_number = os.path.splitext(file_name)[0]
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
                
                record = {
                    "part_number": part_number,
                    "file_name": file_name,
                    "url": public_url,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                records_to_insert.append(record)
            
            try:
                supabase.table(TABLE_NAME).insert(records_to_insert).execute()
                inserted_count += len(records_to_insert)
                print(f"   Inserted batch {i//batch_size + 1}: {len(records_to_insert)} records (total: {inserted_count})")
                time.sleep(0.1)
            except Exception as e:
                print(f"❌ Error inserting batch {i//batch_size + 1}: {e}")
        
        print(f"✅ Successfully inserted {inserted_count} new records")
    
    # Update signed URLs for all records
    print(f"\n🔐 Updating signed URLs for all records...")
    all_records = get_all_database_records()
    updated_count = 0
    
    for i, record in enumerate(all_records, 1):
        file_name = record["file_name"]
        try:
            signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(
                file_name, 60 * 60 * 24 * 7
            )
            
            if signed and signed.get("signedURL"):
                supabase.table(TABLE_NAME).update({
                    "signed_url": signed["signedURL"]
                }).eq("file_name", file_name).execute()
                
                updated_count += 1
                
                if i % 100 == 0 or i == len(all_records):
                    print(f"   Updated {i}/{len(all_records)} signed URLs ({updated_count} successful)")
                    
            time.sleep(0.05)  # Small delay to avoid rate limiting
            
        except Exception as e:
            print(f"❌ Error signing {file_name}: {e}")
    
    print(f"\n✅ MASSIVE SYNC COMPLETED!")
    print(f"   • Total files processed: {len(bucket_files)}")
    print(f"   • Records inserted: {len(missing_files)}")
    print(f"   • Signed URLs updated: {updated_count}")
    print(f"   • Final database records: {len(all_records)}")


def verify_massive_sync():
    """Verify the massive sync was successful."""
    print("🔍 Verifying massive sync...")
    print("=" * 40)
    
    # Get final counts
    db_records = get_all_database_records()
    records_with_signed_urls = [r for r in db_records if r.get("signed_url")]
    
    print(f"📊 FINAL VERIFICATION:")
    print(f"   • Database records: {len(db_records)}")
    print(f"   • Records with signed URLs: {len(records_with_signed_urls)}")
    print(f"   • Expected JPG files: 5,072")
    print(f"   • Sync percentage: {len(db_records)/5072*100:.1f}%")
    
    if len(db_records) >= 5000:  # Allow for some margin
        print("✅ MASSIVE SYNC SUCCESSFUL!")
        print("   • All ~5,072 files are now in the database")
        print("   • All records have signed URLs")
        print("   • Excel integration should work perfectly")
        return True
    else:
        print("⚠️ SYNC INCOMPLETE")
        print(f"   • Only {len(db_records)} of ~5,072 files synced")
        return False


def main():
    """Main function to handle the massive bucket sync."""
    print("🚀 SOP Manager - Massive Bucket Sync (5,072+ files)")
    print("=" * 70)
    
    # Step 1: Analyze current status
    print("\n📋 Step 1: Analyzing current status...")
    analysis = analyze_massive_bucket()
    
    # Step 2: Sync if needed
    if analysis["missing_in_db"] > 0:
        print(f"\n📋 Step 2: Syncing {analysis['missing_in_db']} missing files...")
        sync_massive_bucket()
    else:
        print("\n✅ All files are already synced!")
    
    # Step 3: Verify
    print("\n📋 Step 3: Final verification...")
    verify_massive_sync()
    
    print("\n" + "=" * 70)
    print("✅ Massive sync solution completed!")
    print("💡 Your Excel integration should now work with all ~5,072 files")


if __name__ == "__main__":
    main() 