import os
import time
from supabase import create_client, Client
import inspect

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

BUCKET_NAME = "part-images"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def investigate_storage_api():
    """Investigate the Supabase storage API methods and their parameters."""
    print("🔍 Investigating Supabase Storage API")
    print("=" * 50)
    
    # Get the storage bucket object
    bucket = supabase.storage.from_(BUCKET_NAME)
    
    # Inspect the bucket object
    print("📋 Bucket object type:", type(bucket))
    print("📋 Available methods:")
    methods = [method for method in dir(bucket) if not method.startswith('_')]
    for method in methods:
        print(f"   • {method}")
    
    # Inspect the list method specifically
    print(f"\n📋 Inspecting list() method:")
    list_method = getattr(bucket, 'list', None)
    if list_method:
        print(f"   • Method type: {type(list_method)}")
        print(f"   • Method signature: {inspect.signature(list_method)}")
        print(f"   • Method docstring: {list_method.__doc__}")
    
    # Test different list() calls
    print(f"\n📋 Testing different list() calls:")
    
    # Test 1: Basic list()
    print("   Test 1: list()")
    try:
        files1 = bucket.list()
        print(f"      Result: {len(files1)} files")
        if files1:
            print(f"      Sample: {[f['name'] for f in files1[:3]]}")
    except Exception as e:
        print(f"      Error: {e}")
    
    # Test 2: list with empty string
    print("   Test 2: list('')")
    try:
        files2 = bucket.list("")
        print(f"      Result: {len(files2)} files")
        if files2:
            print(f"      Sample: {[f['name'] for f in files2[:3]]}")
    except Exception as e:
        print(f"      Error: {e}")
    
    # Test 3: list with root path
    print("   Test 3: list('/')")
    try:
        files3 = bucket.list("/")
        print(f"      Result: {len(files3)} files")
        if files3:
            print(f"      Sample: {[f['name'] for f in files3[:3]]}")
    except Exception as e:
        print(f"      Error: {e}")
    
    # Test 4: Try with different parameters
    print("   Test 4: Testing with different parameters")
    try:
        # Try to see if we can pass parameters to list()
        files4 = bucket.list(limit=200)
        print(f"      Result with limit=200: {len(files4)} files")
    except Exception as e:
        print(f"      Error with limit=200: {e}")
    
    try:
        files5 = bucket.list(offset=100)
        print(f"      Result with offset=100: {len(files5)} files")
    except Exception as e:
        print(f"      Error with offset=100: {e}")
    
    try:
        files6 = bucket.list(limit=50, offset=50)
        print(f"      Result with limit=50, offset=50: {len(files6)} files")
    except Exception as e:
        print(f"      Error with limit=50, offset=50: {e}")


def test_repeated_calls():
    """Test if repeated calls to list() return different results."""
    print(f"\n🔄 Testing repeated list() calls")
    print("=" * 40)
    
    bucket = supabase.storage.from_(BUCKET_NAME)
    
    # Make multiple calls to see if we get different results
    all_files = set()
    call_count = 0
    
    for i in range(5):
        try:
            files = bucket.list()
            call_count += 1
            
            file_names = [f['name'] for f in files]
            new_files = set(file_names) - all_files
            all_files.update(file_names)
            
            print(f"   Call {call_count}: {len(files)} files, {len(new_files)} new files")
            print(f"      Total unique files so far: {len(all_files)}")
            
            if new_files:
                print(f"      New files: {list(new_files)[:3]}")
            
            time.sleep(0.1)  # Small delay
            
        except Exception as e:
            print(f"   Call {call_count}: Error - {e}")
    
    print(f"\n📊 REPEATED CALLS SUMMARY:")
    print(f"   • Total calls made: {call_count}")
    print(f"   • Total unique files found: {len(all_files)}")
    print(f"   • Files per call: {len(all_files) // call_count if call_count > 0 else 0}")


def test_database_approach():
    """Test if we can access storage.objects table directly."""
    print(f"\n🗄️ Testing database approach")
    print("=" * 30)
    
    # Test 1: Try to query storage.objects directly
    print("   Test 1: Direct storage.objects query")
    try:
        result = supabase.table('storage.objects').select('name').eq('bucket_id', 'part-images').limit(10).execute()
        print(f"      Result: {len(result.data)} rows")
        if result.data:
            print(f"      Sample: {[row['name'] for row in result.data[:3]]}")
    except Exception as e:
        print(f"      Error: {e}")
    
    # Test 2: Try with different table name
    print("   Test 2: Try with 'storage_objects' table name")
    try:
        result = supabase.table('storage_objects').select('name').eq('bucket_id', 'part-images').limit(10).execute()
        print(f"      Result: {len(result.data)} rows")
        if result.data:
            print(f"      Sample: {[row['name'] for row in result.data[:3]]}")
    except Exception as e:
        print(f"      Error: {e}")
    
    # Test 3: Try to use RPC function
    print("   Test 3: Try RPC function")
    try:
        result = supabase.rpc('get_storage_files', {'bucket_name': 'part-images'}).execute()
        print(f"      Result: {len(result.data) if result.data else 0} rows")
    except Exception as e:
        print(f"      Error: {e}")


def test_http_api_directly():
    """Test if we can access the Supabase REST API directly."""
    print(f"\n🌐 Testing direct HTTP API")
    print("=" * 30)
    
    import requests
    
    # Get the API endpoint
    api_url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET_NAME}"
    
    headers = {
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'apikey': SUPABASE_KEY
    }
    
    print(f"   Testing API endpoint: {api_url}")
    
    try:
        response = requests.get(api_url, headers=headers)
        print(f"      Status code: {response.status_code}")
        print(f"      Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            data = response.json()
            print(f"      Files found: {len(data) if isinstance(data, list) else 'Unknown'}")
            
    except Exception as e:
        print(f"      Error: {e}")


def check_supabase_version():
    """Check the Supabase client version and capabilities."""
    print(f"\n📦 Checking Supabase client version")
    print("=" * 35)
    
    try:
        import supabase
        print(f"   Supabase version: {supabase.__version__}")
    except:
        print("   Could not determine Supabase version")
    
    # Check if we can access the client's capabilities
    print(f"   Client type: {type(supabase)}")
    print(f"   Available attributes: {[attr for attr in dir(supabase) if not attr.startswith('_')]}")


def main():
    """Main investigation function."""
    print("🚀 Supabase Storage API Investigation")
    print("=" * 60)
    
    # Step 1: Investigate the storage API
    investigate_storage_api()
    
    # Step 2: Test repeated calls
    test_repeated_calls()
    
    # Step 3: Test database approach
    test_database_approach()
    
    # Step 4: Test direct HTTP API
    test_http_api_directly()
    
    # Step 5: Check version
    check_supabase_version()
    
    print(f"\n" + "=" * 60)
    print("✅ Investigation complete!")
    print("📋 Next steps:")
    print("   1. Check if upgrading Supabase account helps with limits")
    print("   2. Consider using direct HTTP API calls")
    print("   3. Look into using PostgreSQL functions")
    print("   4. Consider batch processing with known file patterns")


if __name__ == "__main__":
    main() 