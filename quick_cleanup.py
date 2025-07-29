import os
import time
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

BUCKET_NAME = "part-images"
TABLE_NAME = "part_images"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def check_file_exists_in_bucket(file_name):
    """Check if a specific file exists in the bucket."""
    try:
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 60)
        return signed and signed.get("signedURL")
    except Exception:
        return False


def cleanup_orphaned_records():
    """Clean up the 4 known orphaned records."""
    print("🧹 Cleaning up orphaned records...")
    print("=" * 40)
    
    # The 4 orphaned records we identified
    orphaned_files = [
        "BLACK HOSE.pdn",
        "Black Wire.webp", 
        "CCF0F6332628667651B4D26FA1693A8F216DE338D658D254D53B8962A39688A0.jpeg",
        "Heatshrink.pdn"
    ]
    
    print(f"🗑️ Deleting {len(orphaned_files)} orphaned records:")
    for file_name in orphaned_files:
        print(f"   • {file_name}")
    
    deleted_count = 0
    for file_name in orphaned_files:
        try:
            # Verify it doesn't exist in bucket
            if not check_file_exists_in_bucket(file_name):
                # Delete from database
                supabase.table(TABLE_NAME).delete().eq("file_name", file_name).execute()
                print(f"✅ Deleted: {file_name}")
                deleted_count += 1
            else:
                print(f"⚠️ File exists in bucket: {file_name}")
            time.sleep(0.05)
        except Exception as e:
            print(f"❌ Error deleting {file_name}: {e}")
    
    print(f"\n✅ Deleted {deleted_count} orphaned records")
    
    # Final count
    final_count = supabase.table(TABLE_NAME).select("file_name").execute()
    print(f"📊 Final database records: {len(final_count.data)}")


if __name__ == "__main__":
    cleanup_orphaned_records() 