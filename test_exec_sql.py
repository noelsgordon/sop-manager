import os
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def test_exec_sql():
    """Test the exec_sql function."""
    print("🧪 Testing exec_sql function...")
    
    try:
        # Test 1: Simple count query
        print("📊 Test 1: Counting records...")
        result1 = supabase.rpc('exec_sql', {
            'sql_query': 'SELECT COUNT(*) as total_records FROM part_images'
        }).execute()
        
        if result1.data:
            print(f"   ✅ Count query works! Result: {result1.data}")
        else:
            print("   ❌ Count query failed")
            return False
        
        # Test 2: File type breakdown
        print("\n📁 Test 2: File type breakdown...")
        result2 = supabase.rpc('exec_sql', {
            'sql_query': '''
            SELECT 
                CASE 
                    WHEN file_name LIKE '%.jpg' OR file_name LIKE '%.jpeg' THEN 'JPG'
                    WHEN file_name LIKE '%.png' THEN 'PNG'
                    WHEN file_name LIKE '%.gif' THEN 'GIF'
                    WHEN file_name LIKE '%.webp' THEN 'WEBP'
                    ELSE 'OTHER'
                END as file_type,
                COUNT(*) as count
            FROM part_images
            GROUP BY 
                CASE 
                    WHEN file_name LIKE '%.jpg' OR file_name LIKE '%.jpeg' THEN 'JPG'
                    WHEN file_name LIKE '%.png' THEN 'PNG'
                    WHEN file_name LIKE '%.gif' THEN 'GIF'
                    WHEN file_name LIKE '%.webp' THEN 'WEBP'
                    ELSE 'OTHER'
                END
            ORDER BY count DESC
            '''
        }).execute()
        
        if result2.data:
            print(f"   ✅ File type query works! Result: {result2.data}")
        else:
            print("   ❌ File type query failed")
            return False
        
        # Test 3: Recent records
        print("\n🕒 Test 3: Recent records...")
        result3 = supabase.rpc('exec_sql', {
            'sql_query': '''
            SELECT 
                id,
                part_number,
                file_name,
                created_at
            FROM part_images
            ORDER BY created_at DESC
            LIMIT 5
            '''
        }).execute()
        
        if result3.data:
            print(f"   ✅ Recent records query works! Found {len(result3.data)} records")
        else:
            print("   ❌ Recent records query failed")
            return False
        
        print("\n🎉 All tests passed! exec_sql function is working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ exec_sql function test failed: {e}")
        return False


def main():
    """Main function to test exec_sql."""
    print("🔧 SOP Manager - Test exec_sql Function")
    print("=" * 45)
    
    if test_exec_sql():
        print("\n✅ exec_sql function is ready to use!")
        print("   You can now use it in your Python scripts for custom SQL queries.")
    else:
        print("\n❌ exec_sql function is not working.")
        print("   Please run the SQL setup script in your Supabase dashboard first.")


if __name__ == "__main__":
    main() 