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


def get_bucket_file_count_sql():
    """Get the actual file count using SQL query."""
    try:
        # Use SQL to get the actual count
        result = supabase.rpc('exec_sql', {
            'sql_query': "SELECT COUNT(*) as total_files FROM storage.objects WHERE bucket_id = 'part-images'"
        }).execute()
        
        if result.data:
            return result.data[0]['total_files']
        else:
            # Fallback: try direct SQL
            result = supabase.table('storage.objects').select('name').eq('bucket_id', 'part-images').execute()
            return len(result.data) if result.data else 0
            
    except Exception as e:
        print(f"❌ Error getting file count via SQL: {e}")
        return None


def get_all_bucket_files_sql():
    """Get all bucket files using SQL query."""
    try:
        # Use SQL to get all file names
        result = supabase.rpc('exec_sql', {
            'sql_query': "SELECT name FROM storage.objects WHERE bucket_id = 'part-images' ORDER BY name"
        }).execute()
        
        if result.data:
            return [row['name'] for row in result.data]
        else:
            # Fallback: try direct query with pagination
            all_files = []
            offset = 0
            limit = 1000
            
            while True:
                result = supabase.table('storage.objects').select('name').eq('bucket_id', 'part-images').range(offset, offset + limit - 1).execute()
                
                if not result.data:
                    break
                    
                all_files.extend([row['name'] for row in result.data])
                offset += limit
                
                if len(result.data) < limit:
                    break
                    
                time.sleep(0.1)  # Small delay
            
            return all_files
            
    except Exception as e:
        print(f"❌ Error getting files via SQL: {e}")
        return []


def check_file_exists_in_bucket(file_name):
    """Check if a specific file exists in the bucket."""
    try:
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 60)
        return signed and signed.get("signedURL")
    except Exception:
        return False


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


def analyze_large_bucket():
    """Analyze the large bucket using SQL approach."""
    print("🔍 Analyzing large bucket with SQL approach...")
    print("=" * 50)
    
    # Get actual file count
    print("📊 Getting actual file count...")
    total_files = get_bucket_file_count_sql()
    
    if total_files is None:
        print("❌ Could not get file count via SQL")
        return
    
    print(f"📦 Total files in bucket: {total_files}")
    
    # Get all bucket files
    print("📋 Getting all bucket file names...")
    bucket_files = get_all_bucket_files_sql()
    print(f"   Retrieved {len(bucket_files)} file names")
    
    # Filter by file type
    jpg_files = [f for f in bucket_files if f.lower().endswith('.jpg')]
    png_files = [f for f in bucket_files if f.lower().endswith('.png')]
    other_files = [f for f in bucket_files if not f.lower().endswith(('.jpg', '.png'))]
    
    print(f"   • .jpg files: {len(jpg_files)}")
    print(f"   • .png files: {len(png_files)}")
    print(f"   • Other files: {len(other_files)}")
    
    # Get database records
    print("\n📊 Getting database records...")
    db_records = get_all_database_records()
    print(f"   Database records: {len(db_records)}")
    
    # Find missing records
    db_file_names = set(r["file_name"] for r in db_records)
    missing_in_db = [f for f in jpg_files if f not in db_file_names]
    
    print(f"\n🔄 SYNC ANALYSIS:")
    print(f"   • .jpg files missing from database: {len(missing_in_db)}")
    print(f"   • Database records: {len(db_records)}")
    print(f"   • Total bucket files: {len(bucket_files)}")
    
    # Show some missing files
    if missing_in_db:
        print(f"\n📋 Sample missing files (first 10):")
        for i, file_name in enumerate(missing_in_db[:10]):
            print(f"   {i+1}. {file_name}")
        if len(missing_in_db) > 10:
            print(f"   ... and {len(missing_in_db) - 10} more")
    
    return {
        "total_files": len(bucket_files),
        "jpg_files": len(jpg_files),
        "db_records": len(db_records),
        "missing_in_db": len(missing_in_db)
    }


def sync_large_bucket():
    """Sync the large bucket by working with file names directly."""
    print("🚀 Starting large bucket sync...")
    print("=" * 50)
    
    # Get all bucket files
    bucket_files = get_all_bucket_files_sql()
    jpg_files = [f for f in bucket_files if f.lower().endswith('.jpg')]
    
    print(f"📦 Found {len(bucket_files)} total files")
    print(f"🖼️ Found {len(jpg_files)} .jpg files")
    
    # Get database records
    db_records = get_all_database_records()
    db_file_names = set(r["file_name"] for r in db_records)
    
    # Find missing records
    missing_files = [f for f in jpg_files if f not in db_file_names]
    
    print(f"🆕 Found {len(missing_files)} missing records to insert")
    
    # Insert missing records in batches
    if missing_files:
        print("➕ Inserting missing records...")
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
                print(f"   Inserted batch {i//batch_size + 1}: {len(records_to_insert)} records")
                time.sleep(0.1)
            except Exception as e:
                print(f"❌ Error inserting batch {i//batch_size + 1}: {e}")
        
        print(f"✅ Successfully inserted {inserted_count} new records")
    
    # Update signed URLs for all records
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
    
    print(f"\n✅ Sync completed!")
    print(f"   • Total files processed: {len(bucket_files)}")
    print(f"   • .jpg files: {len(jpg_files)}")
    print(f"   • Records inserted: {len(missing_files)}")
    print(f"   • Signed URLs updated: {updated_count}")


if __name__ == "__main__":
    print("🔍 First, let's analyze the large bucket...")
    analyze_large_bucket()
    
    print("\n" + "=" * 50)
    print("💡 To sync the large bucket, run:")
    print("   sync_large_bucket()") 