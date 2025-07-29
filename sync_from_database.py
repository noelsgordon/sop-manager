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


def sync_from_database():
    """Sync based on database records - check which files exist and update accordingly."""
    print("🔄 Starting sync from database records...")
    print("=" * 50)
    
    # Get all database records
    print("📊 Fetching all database records...")
    db_records = get_all_database_records()
    print(f"   Found {len(db_records)} records in database")
    
    # Analyze database records
    jpg_records = [r for r in db_records if r["file_name"].lower().endswith(".jpg")]
    other_records = [r for r in db_records if not r["file_name"].lower().endswith(".jpg")]
    
    print(f"   • .jpg records: {len(jpg_records)}")
    print(f"   • Other records: {len(other_records)}")
    
    # Check which files actually exist in bucket
    print("\n🔍 Checking which files exist in bucket...")
    existing_files = []
    missing_files = []
    
    for i, record in enumerate(db_records, 1):
        file_name = record["file_name"]
        if check_file_exists_in_bucket(file_name):
            existing_files.append(record)
        else:
            missing_files.append(record)
        
        # Progress indicator
        if i % 50 == 0 or i == len(db_records):
            print(f"   Checked {i}/{len(db_records)} files...")
    
    print(f"\n📊 BUCKET ANALYSIS:")
    print(f"   • Files that exist in bucket: {len(existing_files)}")
    print(f"   • Files missing from bucket: {len(missing_files)}")
    
    # Show missing files
    if missing_files:
        print(f"\n❌ Files missing from bucket (first 10):")
        for i, record in enumerate(missing_files[:10]):
            print(f"   {i+1}. {record['file_name']}")
        if len(missing_files) > 10:
            print(f"   ... and {len(missing_files) - 10} more")
    
    # Update signed URLs for existing files
    print(f"\n🔐 Updating signed URLs for existing files...")
    updated_count = 0
    
    for i, record in enumerate(existing_files, 1):
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
                if i % 50 == 0 or i == len(existing_files):
                    print(f"   Updated {i}/{len(existing_files)} signed URLs ({updated_count} successful)")
                    
            time.sleep(0.05)  # Small delay to avoid rate limiting
            
        except Exception as e:
            print(f"❌ Error signing {file_name}: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SYNC SUMMARY:")
    print(f"   • Total database records: {len(db_records)}")
    print(f"   • Files existing in bucket: {len(existing_files)}")
    print(f"   • Files missing from bucket: {len(missing_files)}")
    print(f"   • Signed URLs updated: {updated_count}")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    if missing_files:
        print(f"   • {len(missing_files)} files in database don't exist in bucket")
        print(f"   • Consider cleaning up these orphaned database records")
    if existing_files:
        print(f"   • {len(existing_files)} files are properly synced")
    
    return {
        "total_records": len(db_records),
        "existing_files": len(existing_files),
        "missing_files": len(missing_files),
        "updated_signed_urls": updated_count
    }


def cleanup_missing_files():
    """Remove database records for files that don't exist in the bucket."""
    print("🧹 Cleaning up database records for missing files...")
    print("=" * 50)
    
    # Get all database records
    db_records = get_all_database_records()
    print(f"   Found {len(db_records)} records in database")
    
    # Check which files exist
    missing_records = []
    for i, record in enumerate(db_records, 1):
        file_name = record["file_name"]
        if not check_file_exists_in_bucket(file_name):
            missing_records.append(record)
        
        if i % 50 == 0:
            print(f"   Checked {i}/{len(db_records)} files...")
    
    print(f"\n🗑️ Found {len(missing_records)} records for missing files")
    
    if not missing_records:
        print("✅ No cleanup needed!")
        return
    
    # Show what would be deleted
    print(f"\n📋 Records that would be deleted (first 10):")
    for i, record in enumerate(missing_records[:10]):
        print(f"   {i+1}. {record['file_name']} (Part: {record['part_number']})")
    
    if len(missing_records) > 10:
        print(f"   ... and {len(missing_records) - 10} more")
    
    # Ask for confirmation
    response = input(f"\n❓ Delete {len(missing_records)} records for missing files? (yes/no): ")
    if response.lower() != "yes":
        print("❌ Operation cancelled.")
        return
    
    # Delete missing records
    deleted_count = 0
    for record in missing_records:
        try:
            supabase.table(TABLE_NAME).delete().eq("file_name", record["file_name"]).execute()
            print(f"🗑️ Deleted: {record['file_name']}")
            deleted_count += 1
            time.sleep(0.05)  # Small delay
        except Exception as e:
            print(f"❌ Error deleting {record['file_name']}: {e}")
    
    print(f"\n✅ Deleted {deleted_count} records for missing files")


if __name__ == "__main__":
    # Run the sync
    sync_from_database()
    
    print("\n" + "=" * 50)
    print("💡 To clean up missing files, run:")
    print("   cleanup_missing_files()") 