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
    """List all files in bucket using simple approach (no pagination)."""
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


def analyze_image_status():
    """Analyze the current status of images in bucket vs database."""
    print("🔍 Analyzing image status...")
    print("=" * 50)
    
    # Get all files from bucket
    print("📦 Scanning bucket files...")
    bucket_files = list_all_files_simple(BUCKET_NAME)
    print(f"   Found {len(bucket_files)} total files in bucket")
    
    # Filter by file type
    jpg_files = [f for f in bucket_files if f["name"].lower().endswith(".jpg")]
    png_files = [f for f in bucket_files if f["name"].lower().endswith(".png")]
    other_files = [f for f in bucket_files if not f["name"].lower().endswith((".jpg", ".png"))]
    
    print(f"   • .jpg files: {len(jpg_files)}")
    print(f"   • .png files: {len(png_files)}")
    print(f"   • Other files: {len(other_files)}")
    
    # Get database records
    print("\n📊 Scanning database records...")
    db_records = get_all_database_records()
    print(f"   Found {len(db_records)} records in database")
    
    # Analyze signed URLs
    records_with_signed_urls = [r for r in db_records if r.get("signed_url")]
    records_without_signed_urls = [r for r in db_records if not r.get("signed_url")]
    
    print(f"   • Records with signed URLs: {len(records_with_signed_urls)}")
    print(f"   • Records without signed URLs: {len(records_without_signed_urls)}")
    
    # Find missing records
    db_file_names = set(r["file_name"] for r in db_records)
    missing_in_db = [f["name"] for f in jpg_files if f["name"] not in db_file_names]
    
    # Find orphaned records (in DB but not in bucket)
    bucket_file_names = set(f["name"] for f in bucket_files)
    orphaned_in_db = [r["file_name"] for r in db_records if r["file_name"] not in bucket_file_names]
    
    print(f"\n🔄 SYNC ANALYSIS:")
    print(f"   • .jpg files missing from database: {len(missing_in_db)}")
    print(f"   • Database records not in bucket: {len(orphaned_in_db)}")
    
    # Show some examples
    if missing_in_db:
        print(f"\n📋 Sample missing files (first 10):")
        for i, file_name in enumerate(missing_in_db[:10]):
            print(f"   {i+1}. {file_name}")
        if len(missing_in_db) > 10:
            print(f"   ... and {len(missing_in_db) - 10} more")
    
    if orphaned_in_db:
        print(f"\n🗑️ Sample orphaned records (first 10):")
        for i, file_name in enumerate(orphaned_in_db[:10]):
            print(f"   {i+1}. {file_name}")
        if len(orphaned_in_db) > 10:
            print(f"   ... and {len(orphaned_in_db) - 10} more")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 SUMMARY:")
    print(f"   • Total bucket files: {len(bucket_files)}")
    print(f"   • .jpg files in bucket: {len(jpg_files)}")
    print(f"   • Database records: {len(db_records)}")
    print(f"   • Records with signed URLs: {len(records_with_signed_urls)}")
    print(f"   • Missing from database: {len(missing_in_db)}")
    print(f"   • Orphaned in database: {len(orphaned_in_db)}")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS:")
    if missing_in_db:
        print(f"   • Run comprehensive_sync.py to add {len(missing_in_db)} missing records")
    if records_without_signed_urls:
        print(f"   • Regenerate signed URLs for {len(records_without_signed_urls)} records")
    if orphaned_in_db:
        print(f"   • Consider cleaning up {len(orphaned_in_db)} orphaned database records")
    if png_files:
        print(f"   • Consider converting {len(png_files)} .png files to .jpg")
    
    if not missing_in_db and not records_without_signed_urls:
        print("   • ✅ Database appears to be fully synced!")
    
    return {
        "bucket_files": len(bucket_files),
        "jpg_files": len(jpg_files),
        "db_records": len(db_records),
        "with_signed_urls": len(records_with_signed_urls),
        "missing_in_db": len(missing_in_db),
        "orphaned_in_db": len(orphaned_in_db)
    }


if __name__ == "__main__":
    analyze_image_status() 