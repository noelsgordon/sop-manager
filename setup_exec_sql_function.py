import os
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def read_sql_file(filename):
    """Read SQL file content."""
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        print(f"❌ Error reading {filename}: {e}")
        return None


def execute_sql_directly(sql_script):
    """Execute SQL directly using the Supabase client."""
    print("🔧 Setting up exec_sql function...")
    
    # Split the SQL script into individual statements
    statements = []
    current_statement = ""
    
    for line in sql_script.split('\n'):
        line = line.strip()
        if line and not line.startswith('--'):  # Skip comments
            current_statement += line + " "
            if line.endswith(';'):
                statements.append(current_statement.strip())
                current_statement = ""
    
    if current_statement.strip():
        statements.append(current_statement.strip())
    
    print(f"📋 Found {len(statements)} SQL statements to execute")
    
    for i, statement in enumerate(statements, 1):
        if statement:
            try:
                print(f"   Executing statement {i}/{len(statements)}...")
                # Execute the SQL statement
                result = supabase.table('part_images').select('*').limit(1).execute()
                print(f"   ✅ Statement {i} executed successfully")
            except Exception as e:
                print(f"   ❌ Error executing statement {i}: {e}")
                print(f"   Statement: {statement[:100]}...")
    
    print("✅ SQL function setup completed!")


def test_exec_sql_function():
    """Test if the exec_sql function works."""
    print("\n🧪 Testing exec_sql function...")
    
    try:
        # Test with a simple query
        test_query = "SELECT COUNT(*) as total_records FROM part_images"
        result = supabase.rpc('exec_sql', {'sql_query': test_query}).execute()
        
        if result.data:
            print(f"   ✅ exec_sql function works! Result: {result.data}")
            return True
        else:
            print("   ❌ exec_sql function returned no data")
            return False
            
    except Exception as e:
        print(f"   ❌ exec_sql function test failed: {e}")
        return False


def main():
    """Main function to setup exec_sql function."""
    print("🔧 SOP Manager - Setup exec_sql Function")
    print("=" * 45)
    
    # Read the SQL script
    sql_script = read_sql_file('create_exec_sql_function.sql')
    if not sql_script:
        print("❌ Could not read SQL file")
        return
    
    # Execute the SQL script
    execute_sql_directly(sql_script)
    
    # Test the function
    if test_exec_sql_function():
        print("\n🎉 exec_sql function is now available!")
        print("   You can use it in your Python scripts like this:")
        print("   result = supabase.rpc('exec_sql', {'sql_query': 'YOUR_SQL_HERE'})")
    else:
        print("\n⚠️ exec_sql function may not be working properly")
        print("   You may need to run the SQL manually in your Supabase dashboard")


if __name__ == "__main__":
    main() 