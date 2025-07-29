import os
from supabase import create_client, Client
import time

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

BUCKET_NAME = "part-images"
TABLE_NAME = "part_images"

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


def cleanup_orphaned_records(dry_run=True):
    """Clean up orphaned database records that don't exist in the bucket."""
    print("🧹 Cleaning up orphaned database records...")
    print("=" * 50)
    
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print("=" * 50)
    
    # Get all files from bucket
    print("📦 Scanning bucket files...")
    bucket_files = list_all_files_simple(BUCKET_NAME)
    bucket_file_names = set(f["name"] for f in bucket_files)
    print(f"   Found {len(bucket_files)} files in bucket")
    
    # Get all database records
    print("📊 Scanning database records...")
    db_records = get_all_database_records()
    print(f"   Found {len(db_records)} records in database")
    
    # Find orphaned records
    orphaned_records = []
    for record in db_records:
        if record["file_name"] not in bucket_file_names:
            orphaned_records.append(record)
    
    print(f"\n🗑️ Found {len(orphaned_records)} orphaned records")
    
    if not orphaned_records:
        print("✅ No orphaned records found!")
        return
    
    # Show orphaned records
    print("\n📋 Orphaned records:")
    for i, record in enumerate(orphaned_records[:20], 1):
        print(f"   {i}. {record['file_name']} (Part: {record['part_number']})")
    
    if len(orphaned_records) > 20:
        print(f"   ... and {len(orphaned_records) - 20} more")
    
    # Ask for confirmation if not dry run
    if not dry_run:
        response = input(f"\n❓ Delete {len(orphaned_records)} orphaned records? (yes/no): ")
        if response.lower() != "yes":
            print("❌ Operation cancelled.")
            return
    
    # Delete orphaned records
    deleted_count = 0
    for record in orphaned_records:
        try:
            if not dry_run:
                supabase.table(TABLE_NAME).delete().eq("file_name", record["file_name"]).execute()
                print(f"🗑️ Deleted: {record['file_name']}")
            else:
                print(f"🗑️ Would delete: {record['file_name']}")
            deleted_count += 1
            time.sleep(0.05)  # Small delay
        except Exception as e:
            print(f"❌ Error deleting {record['file_name']}: {e}")
    
    print(f"\n✅ {'Would have deleted' if dry_run else 'Deleted'} {deleted_count} orphaned records")
    
    # Final count
    if not dry_run:
        final_count = supabase.table(TABLE_NAME).select("file_name").execute()
        print(f"📊 Final database records: {len(final_count.data)}")


if __name__ == "__main__":
    # First run with dry_run=True to see what would be deleted
    cleanup_orphaned_records(dry_run=True)
    
    print("\n" + "=" * 50)
    print("💡 To actually delete orphaned records, run:")
    print("   cleanup_orphaned_records(dry_run=False)")
    print("   or modify the script to set dry_run=False") 