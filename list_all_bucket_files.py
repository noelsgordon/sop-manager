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


def test_list_methods():
    """Test different methods to list files in the bucket."""
    print("🔍 Testing different methods to list bucket files...")
    print("=" * 50)
    
    # Method 1: Simple list
    print("📋 Method 1: Simple list()")
    try:
        files1 = supabase.storage.from_(BUCKET_NAME).list()
        print(f"   Result: {len(files1)} files")
        if files1:
            print(f"   Sample files: {[f['name'] for f in files1[:5]]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Method 2: List with empty path
    print("\n📋 Method 2: list('')")
    try:
        files2 = supabase.storage.from_(BUCKET_NAME).list("")
        print(f"   Result: {len(files2)} files")
        if files2:
            print(f"   Sample files: {[f['name'] for f in files2[:5]]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Method 3: List with root path
    print("\n📋 Method 3: list('/')")
    try:
        files3 = supabase.storage.from_(BUCKET_NAME).list("/")
        print(f"   Result: {len(files3)} files")
        if files3:
            print(f"   Sample files: {[f['name'] for f in files3[:5]]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Method 4: Try with different parameters
    print("\n📋 Method 4: list() with different approach")
    try:
        # Try to get more files by checking if there are subdirectories
        files4 = supabase.storage.from_(BUCKET_NAME).list()
        print(f"   Initial result: {len(files4)} files")
        
        # Check if any files have path separators
        files_with_paths = [f for f in files4 if '/' in f['name']]
        print(f"   Files with paths: {len(files_with_paths)}")
        
        if files_with_paths:
            # Try to list from subdirectories
            for file_with_path in files_with_paths[:3]:  # Check first 3
                path = '/'.join(file_with_path['name'].split('/')[:-1])
                print(f"   Trying to list from path: {path}")
                try:
                    sub_files = supabase.storage.from_(BUCKET_NAME).list(path)
                    print(f"     Found {len(sub_files)} files in {path}")
                except Exception as e:
                    print(f"     Error listing {path}: {e}")
                    
    except Exception as e:
        print(f"   Error: {e}")
    
    # Method 5: Check database records to understand what should be there
    print("\n📋 Method 5: Analyze database records")
    try:
        db_records = supabase.table(TABLE_NAME).select("file_name").execute().data
        print(f"   Database records: {len(db_records)}")
        
        # Check file extensions
        extensions = {}
        for record in db_records:
            ext = os.path.splitext(record['file_name'])[1].lower()
            extensions[ext] = extensions.get(ext, 0) + 1
        
        print(f"   File extensions in database:")
        for ext, count in sorted(extensions.items()):
            print(f"     {ext}: {count}")
            
        # Show some sample file names
        print(f"   Sample file names from database:")
        for i, record in enumerate(db_records[:10]):
            print(f"     {i+1}. {record['file_name']}")
            
    except Exception as e:
        print(f"   Error: {e}")


def check_bucket_info():
    """Check bucket information and capabilities."""
    print("\n🔍 Checking bucket information...")
    print("=" * 50)
    
    try:
        # Try to get bucket info
        print("📦 Attempting to get bucket information...")
        
        # List files and analyze
        files = supabase.storage.from_(BUCKET_NAME).list()
        print(f"   Files returned: {len(files)}")
        
        if files:
            # Analyze file structure
            file_types = {}
            file_sizes = []
            
            for file in files:
                ext = os.path.splitext(file['name'])[1].lower()
                file_types[ext] = file_types.get(ext, 0) + 1
                if 'metadata' in file and 'size' in file['metadata']:
                    file_sizes.append(file['metadata']['size'])
            
            print(f"   File types found:")
            for ext, count in sorted(file_types.items()):
                print(f"     {ext}: {count}")
            
            if file_sizes:
                avg_size = sum(file_sizes) / len(file_sizes)
                print(f"   Average file size: {avg_size:.0f} bytes")
                print(f"   Total size: {sum(file_sizes):,} bytes")
        
    except Exception as e:
        print(f"   Error: {e}")


if __name__ == "__main__":
    test_list_methods()
    check_bucket_info() 