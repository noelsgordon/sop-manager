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


def get_small_batch_of_files():
    """Get a small batch of files (first 200) to test with."""
    print("📋 Getting small batch of files for testing...")
    
    bucket = supabase.storage.from_(BUCKET_NAME)
    
    # Get first batch of files
    options = {
        'limit': 200,
        'offset': 0,
        'sortBy': {'column': 'name', 'order': 'asc'}
    }
    
    try:
        files = bucket.list(options=options)
        print(f"📊 Retrieved {len(files)} files for testing")
        return files
    except Exception as e:
        print(f"❌ Error getting files: {e}")
        return []


def get_database_schema():
    """Check what columns exist in the part_images table."""
    print("🔍 Checking database schema...")
    
    try:
        # Try to get one record to see the structure
        result = supabase.table(TABLE_NAME).select("*").limit(1).execute()
        if result.data:
            columns = list(result.data[0].keys())
            print(f"📊 Available columns: {columns}")
            return columns
        else:
            print("⚠️ No records found, checking table structure...")
            return []
    except Exception as e:
        print(f"❌ Error checking schema: {e}")
        return []


def test_small_batch_sync():
    """Test sync with a small batch of files."""
    print("🧪 Testing small batch sync...")
    print("=" * 50)
    
    # Check database schema first
    available_columns = get_database_schema()
    
    # Get small batch of files
    bucket_files = get_small_batch_of_files()
    
    if not bucket_files:
        print("❌ No files found for testing")
        return 0, 0
    
    # Filter for image files
    image_files = [f for f in bucket_files if f["name"].lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))]
    print(f"🖼️ Found {len(image_files)} image files for testing")
    
    # Get existing database records
    try:
        existing_records = supabase.table(TABLE_NAME).select("*").execute().data
        existing_file_names = {record["file_name"] for record in existing_records if record.get("file_name")}
        print(f"📊 Found {len(existing_records)} existing database records")
    except Exception as e:
        print(f"❌ Error getting existing records: {e}")
        existing_file_names = set()
    
    # Find files that need to be added (limit to first 50 for testing)
    files_to_add = []
    for file_info in image_files[:50]:  # Only test with first 50
        file_name = file_info["name"]
        if file_name not in existing_file_names:
            # Extract part number from file name
            part_number = os.path.splitext(file_name)[0]  # remove extension
            
            # Construct public URL
            encoded_file = quote(file_name)
            url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{encoded_file}"
            
            # Create record without updated_at if it doesn't exist
            record = {
                "part_number": part_number,
                "file_name": file_name,
                "url": url
            }
            
            # Only add created_at if the column exists
            if "created_at" in available_columns:
                record["created_at"] = datetime.now(timezone.utc).isoformat()
            
            files_to_add.append(record)
    
    print(f"📊 TEST ANALYSIS:")
    print(f"   • Total image files in batch: {len(image_files)}")
    print(f"   • Existing database records: {len(existing_records) if 'existing_records' in locals() else 0}")
    print(f"   • Files to add to database: {len(files_to_add)}")
    
    if not files_to_add:
        print("✅ All test files are already in the database!")
        return 0, 0
    
    # Add new files to database (test with first 10)
    test_files = files_to_add[:10]
    print(f"\n📋 Testing with {len(test_files)} files...")
    
    added_count = 0
    failed_count = 0
    
    for i, record in enumerate(test_files, 1):
        try:
            # Insert the record
            supabase.table(TABLE_NAME).upsert(record, on_conflict="part_number").execute()
            print(f"   ✅ Added: {record['file_name']}")
            added_count += 1
            
            time.sleep(0.1)  # Small delay
                
        except Exception as e:
            print(f"   ❌ Failed to add {record['file_name']}: {e}")
            failed_count += 1
    
    print(f"\n📊 TEST RESULTS:")
    print(f"   • Successfully added: {added_count}")
    print(f"   • Failed additions: {failed_count}")
    
    return added_count, failed_count


def test_signed_url_update():
    """Test signed URL update with a small batch."""
    print("\n🔗 Testing signed URL update...")
    print("=" * 40)
    
    # Get a small batch of database records
    try:
        result = supabase.table(TABLE_NAME).select("*").limit(10).execute()
        test_records = result.data
        print(f"📋 Testing with {len(test_records)} records")
    except Exception as e:
        print(f"❌ Error getting test records: {e}")
        return 0, 0
    
    updated_count = 0
    failed_count = 0
    
    for i, record in enumerate(test_records, 1):
        try:
            file_name = record["file_name"]
            
            # Generate signed URL
            signed_url_result = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 3600)  # 1 hour expiry
            
            if signed_url_result and signed_url_result.get("signedURL"):
                signed_url = signed_url_result["signedURL"]
                
                # Update the record with signed URL (without updated_at)
                update_data = {"signed_url": signed_url}
                
                supabase.table(TABLE_NAME).update(update_data).eq("file_name", file_name).execute()
                
                print(f"   ✅ Updated: {file_name}")
                updated_count += 1
            else:
                print(f"   ⚠️ No signed URL generated for: {file_name}")
                failed_count += 1
            
            time.sleep(0.1)  # Small delay
                
        except Exception as e:
            print(f"   ❌ Failed to update {record.get('file_name', 'unknown')}: {e}")
            failed_count += 1
    
    print(f"\n📊 SIGNED URL TEST RESULTS:")
    print(f"   • Successfully updated: {updated_count}")
    print(f"   • Failed updates: {failed_count}")
    
    return updated_count, failed_count


def main():
    """Main function to test small batch sync."""
    print("🧪 SOP Manager - Small Batch Sync Test")
    print("=" * 50)
    
    # Step 1: Test database sync
    print("\n📋 Step 1: Testing database sync...")
    added_count, failed_count = test_small_batch_sync()
    
    # Step 2: Test signed URL update
    print(f"\n📋 Step 2: Testing signed URL update...")
    updated_count, failed_url_count = test_signed_url_update()
    
    print("\n" + "=" * 50)
    if updated_count > 0:
        print("✅ Small batch test completed successfully!")
        print(f"   • Added {added_count} test files to database")
        print(f"   • Updated {updated_count} records with signed URLs")
        print(f"   • Failed additions: {failed_count}")
        print(f"   • Failed URL updates: {failed_url_count}")
        print("\n🎉 Ready for full sync!")
    else:
        print("⚠️ Test completed with issues")
        print(f"   • Added {added_count} test files to database")
        print(f"   • Updated {updated_count} records with signed URLs")
        print(f"   • Failed additions: {failed_count}")
        print(f"   • Failed URL updates: {failed_url_count}")
        print("\n🔧 Need to fix issues before full sync")


if __name__ == "__main__":
    main() 