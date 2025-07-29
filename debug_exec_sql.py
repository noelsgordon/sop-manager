import os
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def debug_exec_sql():
    """Debug the exec_sql function response format."""
    print("🔍 Debugging exec_sql function...")
    
    try:
        # Test with the actual query that's failing
        query = """
        SELECT 
            COUNT(*) as total_records,
            COUNT(CASE WHEN signed_url IS NOT NULL THEN 1 END) as records_with_signed_urls,
            COUNT(CASE WHEN signed_url IS NULL THEN 1 END) as records_without_signed_urls,
            COUNT(CASE WHEN url IS NOT NULL THEN 1 END) as records_with_urls,
            COUNT(CASE WHEN url IS NULL THEN 1 END) as records_without_urls
        FROM part_images;
        """
        
        result = supabase.rpc('exec_sql', {'sql_query': query}).execute()
        
        print("📊 Raw result:")
        print(f"   Type: {type(result)}")
        print(f"   Data: {result.data}")
        print(f"   Data type: {type(result.data)}")
        
        if result.data:
            print(f"   Data length: {len(result.data)}")
            if len(result.data) > 0:
                print(f"   First element: {result.data[0]}")
                print(f"   First element type: {type(result.data[0])}")
                if isinstance(result.data[0], dict):
                    print(f"   First element keys: {result.data[0].keys()}")
            else:
                print("   Data is empty list")
        else:
            print("   Data is None")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Main function to debug exec_sql."""
    print("🔧 SOP Manager - Debug exec_sql Function")
    print("=" * 45)
    
    debug_exec_sql()


if __name__ == "__main__":
    main() 