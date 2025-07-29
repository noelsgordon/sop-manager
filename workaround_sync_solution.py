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
    """Check if a specific file exists in the bucket."""
    try:
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 60)
        return signed and signed.get("signedURL")
    except Exception:
        return False


def get_bucket_files_in_chunks():
    """Get bucket files in chunks of 100 (Supabase limit)."""
    print("📋 Getting bucket files in chunks...")
    all_files = []
    chunk_count = 0
    
    while True:
        try:
            # Get next chunk of files
            files = supabase.storage.from_(BUCKET_NAME).list()
            
            if not files:
                break
                
            # Filter for JPG files
            jpg_files = [f["name"] for f in files if f["name"].lower().endswith('.jpg')]
            all_files.extend(jpg_files)
            
            chunk_count += 1
            print(f"   Chunk {chunk_count}: {len(jpg_files)} JPG files (total: {len(all_files)})")
            
            # If we got fewer than 100 files, we've reached the end
            if len(files) < 100:
                break
                
            time.sleep(0.1)  # Small delay
            
        except Exception as e:
            print(f"❌ Error getting chunk {chunk_count}: {e}")
            break
    
    return all_files


def create_file_list_from_pattern():
    """Create a list of potential file names based on patterns."""
    print("📋 Creating file list from patterns...")
    
    # Common patterns for part numbers
    patterns = [
        "MA_{:06d}.jpg",  # MA_000001.jpg, MA_000002.jpg, etc.
        "{:06d}.jpg",     # 000001.jpg, 000002.jpg, etc.
        "PART_{:06d}.jpg", # PART_000001.jpg, etc.
        "IMG_{:06d}.jpg",  # IMG_000001.jpg, etc.
    ]
    
    potential_files = []
    
    # Generate potential file names
    for pattern in patterns:
        for i in range(1, 10000):  # Check up to 10,000 files
            file_name = pattern.format(i)
            potential_files.append(file_name)
    
    print(f"   Generated {len(potential_files)} potential file names")
    return potential_files


def verify_files_exist(file_list, max_check=1000):
    """Verify which files actually exist in the bucket."""
    print(f"🔍 Verifying which files exist (checking up to {max_check})...")
    existing_files = []
    checked_count = 0
    
    for file_name in file_list[:max_check]:
        if check_file_exists_in_bucket(file_name):
            existing_files.append(file_name)
        
        checked_count += 1
        if checked_count % 100 == 0:
            print(f"   Checked {checked_count}/{max_check} files, found {len(existing_files)} existing")
    
    print(f"✅ Found {len(existing_files)} existing files out of {checked_count} checked")
    return existing_files


def analyze_with_workaround():
    """Analyze the bucket using workaround methods."""
    print("🔍 Analyzing bucket with workaround methods...")
    print("=" * 60)
    
    # Method 1: Try to get files in chunks
    print("📋 Method 1: Getting files in chunks...")
    chunk_files = get_bucket_files_in_chunks()
    print(f"   Retrieved {len(chunk_files)} files via chunks")
    
    # Method 2: Generate potential file names
    print("\n📋 Method 2: Generating potential file names...")
    potential_files = create_file_list_from_pattern()
    
    # Method 3: Verify which files exist
    print("\n📋 Method 3: Verifying file existence...")
    existing_files = verify_files_exist(potential_files, max_check=2000)
    
    # Get database records
    print("\n📊 Getting database records...")
    db_records = get_all_database_records()
    print(f"   Database records: {len(db_records)}")
    
    # Find missing records
    db_file_names = set(r["file_name"] for r in db_records)
    missing_in_db = [f for f in existing_files if f not in db_file_names]
    
    print(f"\n🔄 WORKAROUND ANALYSIS:")
    print(f"   • Files found via chunks: {len(chunk_files)}")
    print(f"   • Files found via verification: {len(existing_files)}")
    print(f"   • Database records: {len(db_records)}")
    print(f"   • Files missing from database: {len(missing_in_db)}")
    
    # Show some missing files
    if missing_in_db:
        print(f"\n📋 Sample missing files (first 10):")
        for i, file_name in enumerate(missing_in_db[:10]):
            print(f"   {i+1}. {file_name}")
        if len(missing_in_db) > 10:
            print(f"   ... and {len(missing_in_db) - 10} more")
    
    return {
        "chunk_files": len(chunk_files),
        "existing_files": len(existing_files),
        "db_records": len(db_records),
        "missing_in_db": len(missing_in_db),
        "file_list": existing_files
    }


def sync_with_workaround():
    """Sync using the workaround method."""
    print("🚀 Starting workaround sync...")
    print("=" * 50)
    
    # Get analysis
    analysis = analyze_with_workaround()
    
    if analysis["missing_in_db"] == 0:
        print("✅ All found files are already in database!")
        return
    
    # Insert missing files
    missing_files = []
    db_records = get_all_database_records()
    db_file_names = set(r["file_name"] for r in db_records)
    
    for file_name in analysis["file_list"]:
        if file_name not in db_file_names:
            missing_files.append(file_name)
    
    print(f"🆕 Found {len(missing_files)} missing files to insert")
    
    if missing_files:
        print("➕ Inserting missing files...")
        batch_size = 100
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
    
    # Update signed URLs
    print(f"\n🔐 Updating signed URLs...")
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
                    
            time.sleep(0.05)
            
        except Exception as e:
            print(f"❌ Error signing {file_name}: {e}")
    
    print(f"\n✅ WORKAROUND SYNC COMPLETED!")
    print(f"   • Files found: {len(analysis['existing_files'])}")
    print(f"   • Records inserted: {len(missing_files)}")
    print(f"   • Signed URLs updated: {updated_count}")
    print(f"   • Final database records: {len(all_records)}")


def main():
    """Main function for workaround sync."""
    print("🚀 SOP Manager - Workaround Sync (5,072+ files)")
    print("=" * 60)
    
    # Run the workaround sync
    sync_with_workaround()
    
    print("\n" + "=" * 60)
    print("✅ Workaround sync completed!")
    print("💡 This approach works around the Supabase SDK limitations")


if __name__ == "__main__":
    main() 