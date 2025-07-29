import os
import time
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

BUCKET_NAME = "part-images"
TABLE_NAME = "part_images"
BATCH_SIZE = 1000  # Process in batches to avoid timeouts

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def list_all_files_simple(bucket_name: str):
    """List all files in bucket using simple approach."""
    try:
        # Try to get all files at once (Supabase may return all files)
        files = supabase.storage.from_(bucket_name).list()
        print(f"   Retrieved {len(files)} files in single request")
        return files
    except Exception as e:
        print(f"❌ Error listing files: {e}")
        return []


def get_existing_records_paginated():
    """Get all existing records from the table using pagination."""
    all_records = []
    offset = 0
    limit = 1000
    
    while True:
        try:
            result = supabase.table(TABLE_NAME).select("file_name, part_number").range(offset, offset + limit - 1).execute()
            
            if not result.data:
                break
                
            all_records.extend(result.data)
            offset += limit
            
            # If we got fewer records than the limit, we've reached the end
            if len(result.data) < limit:
                break
                
        except Exception as e:
            print(f"❌ Error fetching records at offset {offset}: {e}")
            break
    
    return all_records


def insert_records_in_batches(records_to_insert):
    """Insert records in batches to avoid timeouts."""
    if not records_to_insert:
        return 0
    
    total_inserted = 0
    batch_size = 100  # Supabase insert batch limit
    
    for i in range(0, len(records_to_insert), batch_size):
        batch = records_to_insert[i:i + batch_size]
        try:
            supabase.table(TABLE_NAME).insert(batch).execute()
            total_inserted += len(batch)
            print(f"➕ Inserted batch {i//batch_size + 1}: {len(batch)} records")
            time.sleep(0.1)  # Small delay between batches
        except Exception as e:
            print(f"❌ Error inserting batch {i//batch_size + 1}: {e}")
    
    return total_inserted


def update_signed_urls_in_batches():
    """Update signed URLs for all records in batches."""
    print("🔐 Updating signed URLs for all records...")
    
    # Get all records that need signed URL updates
    all_records = supabase.table(TABLE_NAME).select("file_name").execute().data
    
    if not all_records:
        print("⚠️ No records found to update.")
        return 0
    
    updated_count = 0
    total_records = len(all_records)
    
    for i, row in enumerate(all_records, 1):
        file_name = row["file_name"]
        try:
            # Generate signed URL (7 days expiry)
            signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(
                file_name, 60 * 60 * 24 * 7
            )
            
            if signed and signed.get("signedURL"):
                # Update the record
                supabase.table(TABLE_NAME).update({
                    "signed_url": signed["signedURL"]
                }).eq("file_name", file_name).execute()
                
                updated_count += 1
                
                # Progress indicator
                if i % 100 == 0 or i == total_records:
                    print(f"🔗 Updated {i}/{total_records} signed URLs ({updated_count} successful)")
                    
            time.sleep(0.05)  # Small delay to avoid rate limiting
            
        except Exception as e:
            print(f"❌ Error signing {file_name}: {e}")
    
    return updated_count


def comprehensive_sync():
    """Main function to sync all images comprehensively."""
    print("🚀 Starting comprehensive image sync...")
    print("=" * 50)
    
    # Step 1: List all files in bucket
    print("🔍 Scanning bucket files...")
    all_files = list_all_files_simple(BUCKET_NAME)
    
    if not all_files:
        print("⚠️ No files found in bucket.")
        return
    
    print(f"📦 Found {len(all_files)} total files in bucket.")
    
    # Step 2: Filter for .jpg files only
    jpg_files = [f for f in all_files if f["name"].lower().endswith(".jpg")]
    print(f"🖼️ Found {len(jpg_files)} .jpg files.")
    
    # Step 3: Get existing records from database
    print("📊 Fetching existing database records...")
    existing_records = get_existing_records_paginated()
    existing_files = set(row["file_name"] for row in existing_records)
    print(f"📋 Found {len(existing_records)} existing records in database.")
    
    # Step 4: Identify missing records
    missing_files = []
    for file in jpg_files:
        if file["name"] not in existing_files:
            missing_files.append(file["name"])
    
    print(f"🆕 Found {len(missing_files)} missing records to insert.")
    
    # Step 5: Insert missing records
    if missing_files:
        print("➕ Inserting missing records...")
        records_to_insert = []
        
        for file_name in missing_files:
            part_number = os.path.splitext(file_name)[0]
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
            
            record = {
                "part_number": part_number,
                "file_name": file_name,
                "url": public_url,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            records_to_insert.append(record)
        
        inserted_count = insert_records_in_batches(records_to_insert)
        print(f"✅ Successfully inserted {inserted_count} new records.")
    else:
        print("✅ No missing records to insert.")
    
    # Step 6: Update signed URLs for all records
    print("\n" + "=" * 50)
    updated_count = update_signed_urls_in_batches()
    
    # Final summary
    print("\n" + "=" * 50)
    print("📊 SYNC SUMMARY:")
    print(f"   • Total files in bucket: {len(all_files)}")
    print(f"   • .jpg files: {len(jpg_files)}")
    print(f"   • Existing database records: {len(existing_records)}")
    print(f"   • Missing records inserted: {len(missing_files)}")
    print(f"   • Signed URLs updated: {updated_count}")
    
    # Get final count
    final_count = supabase.table(TABLE_NAME).select("file_name").execute()
    print(f"   • Final database records: {len(final_count.data)}")
    
    print("\n✅ Comprehensive sync completed!")


if __name__ == "__main__":
    comprehensive_sync() 