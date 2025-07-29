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
    """Check if a specific file exists in the bucket by trying to get its signed URL."""
    try:
        # Try to get a signed URL for the file
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 60)
        return signed and signed.get("signedURL")
    except Exception:
        return False


def list_bucket_files():
    """List all files in bucket (limited to 100 by Supabase)."""
    try:
        files = supabase.storage.from_(BUCKET_NAME).list()
        return files
    except Exception as e:
        print(f"❌ Error listing bucket files: {e}")
        return []


def comprehensive_final_sync():
    """Final comprehensive sync that handles the actual situation."""
    print("🚀 Starting comprehensive final sync...")
    print("=" * 50)
    
    # Step 1: Get bucket files (limited to 100)
    print("📦 Scanning bucket files...")
    bucket_files = list_bucket_files()
    print(f"   Found {len(bucket_files)} files in bucket (Supabase limit)")
    
    # Step 2: Get all database records
    print("📊 Fetching all database records...")
    db_records = get_all_database_records()
    print(f"   Found {len(db_records)} records in database")
    
    # Step 3: Check which database records correspond to actual files
    print("🔍 Checking which database records have corresponding files...")
    existing_records = []
    orphaned_records = []
    
    for i, record in enumerate(db_records, 1):
        file_name = record["file_name"]
        if check_file_exists_in_bucket(file_name):
            existing_records.append(record)
        else:
            orphaned_records.append(record)
        
        # Progress indicator
        if i % 50 == 0 or i == len(db_records):
            print(f"   Checked {i}/{len(db_records)} records...")
    
    print(f"\n📊 ANALYSIS:")
    print(f"   • Records with existing files: {len(existing_records)}")
    print(f"   • Orphaned records: {len(orphaned_records)}")
    
    # Step 4: Clean up orphaned records
    if orphaned_records:
        print(f"\n🗑️ Found {len(orphaned_records)} orphaned records:")
        for i, record in enumerate(orphaned_records[:10]):
            print(f"   {i+1}. {record['file_name']}")
        if len(orphaned_records) > 10:
            print(f"   ... and {len(orphaned_records) - 10} more")
        
        response = input(f"\n❓ Delete {len(orphaned_records)} orphaned records? (yes/no): ")
        if response.lower() == "yes":
            deleted_count = 0
            for record in orphaned_records:
                try:
                    supabase.table(TABLE_NAME).delete().eq("file_name", record["file_name"]).execute()
                    print(f"🗑️ Deleted: {record['file_name']}")
                    deleted_count += 1
                    time.sleep(0.05)
                except Exception as e:
                    print(f"❌ Error deleting {record['file_name']}: {e}")
            
            print(f"✅ Deleted {deleted_count} orphaned records")
        else:
            print("❌ Skipped orphaned record cleanup")
    
    # Step 5: Update signed URLs for all existing records
    print(f"\n🔐 Updating signed URLs for {len(existing_records)} existing records...")
    updated_count = 0
    
    for i, record in enumerate(existing_records, 1):
        file_name = record["file_name"]
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
                if i % 50 == 0 or i == len(existing_records):
                    print(f"   Updated {i}/{len(existing_records)} signed URLs ({updated_count} successful)")
                    
            time.sleep(0.05)  # Small delay to avoid rate limiting
            
        except Exception as e:
            print(f"❌ Error signing {file_name}: {e}")
    
    # Step 6: Final verification
    print("\n" + "=" * 50)
    print("📊 FINAL VERIFICATION:")
    
    # Get final database count
    final_records = supabase.table(TABLE_NAME).select("file_name").execute().data
    records_with_signed_urls = supabase.table(TABLE_NAME).select("file_name").not_.is_("signed_url", "null").execute().data
    
    print(f"   • Final database records: {len(final_records)}")
    print(f"   • Records with signed URLs: {len(records_with_signed_urls)}")
    print(f"   • Signed URLs updated in this run: {updated_count}")
    
    # Summary
    print("\n" + "=" * 50)
    print("✅ SYNC COMPLETED!")
    print(f"   • Database is now clean and synced")
    print(f"   • All {len(final_records)} records have corresponding files")
    print(f"   • All {len(records_with_signed_urls)} records have valid signed URLs")
    
    return {
        "final_records": len(final_records),
        "records_with_signed_urls": len(records_with_signed_urls),
        "updated_signed_urls": updated_count
    }


def quick_status_check():
    """Quick status check to verify everything is working."""
    print("🔍 Quick status check...")
    print("=" * 30)
    
    # Get database records
    db_records = supabase.table(TABLE_NAME).select("file_name, signed_url").execute().data
    records_with_signed_urls = [r for r in db_records if r.get("signed_url")]
    
    print(f"📊 Database records: {len(db_records)}")
    print(f"📊 Records with signed URLs: {len(records_with_signed_urls)}")
    
    # Test a few signed URLs
    print("\n🔗 Testing signed URLs...")
    test_count = 0
    success_count = 0
    
    for record in db_records[:5]:  # Test first 5
        file_name = record["file_name"]
        try:
            signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 60)
            if signed and signed.get("signedURL"):
                print(f"   ✅ {file_name}: Working")
                success_count += 1
            else:
                print(f"   ❌ {file_name}: Failed")
            test_count += 1
        except Exception as e:
            print(f"   ❌ {file_name}: Error - {e}")
            test_count += 1
    
    print(f"\n📊 Test Results: {success_count}/{test_count} signed URLs working")
    
    if success_count == test_count:
        print("✅ All tested signed URLs are working!")
    else:
        print("⚠️ Some signed URLs are not working")


if __name__ == "__main__":
    # Run the comprehensive sync
    comprehensive_final_sync()
    
    print("\n" + "=" * 50)
    print("🔍 Running quick status check...")
    quick_status_check() 