import os
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def run_sql_query(query, description):
    """Run a SQL query and return results."""
    try:
        result = supabase.rpc('exec_sql', {'sql_query': query}).execute()
        # Check if there's an error in the response
        if result.data and isinstance(result.data, dict) and 'error' in result.data:
            print(f"❌ SQL Error in '{description}': {result.data['error']}")
            return None
        # The result format is: [{"column": "value"}]
        if result.data and isinstance(result.data, list):
            return result.data
        return None
    except Exception as e:
        print(f"❌ Error running query '{description}': {e}")
        return None


def check_basic_table_info():
    """Check basic table information."""
    print("📊 BASIC TABLE INFORMATION")
    print("=" * 40)
    
    query = """
    SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN signed_url IS NOT NULL THEN 1 END) as records_with_signed_urls,
        COUNT(CASE WHEN signed_url IS NULL THEN 1 END) as records_without_signed_urls,
        COUNT(CASE WHEN url IS NOT NULL THEN 1 END) as records_with_urls,
        COUNT(CASE WHEN url IS NULL THEN 1 END) as records_without_urls
    FROM part_images
    """
    
    result = run_sql_query(query, "Basic table info")
    if result and len(result) > 0:
        data = result[0]
        print(f"   • Total records: {data['total_records']}")
        print(f"   • Records with signed URLs: {data['records_with_signed_urls']}")
        print(f"   • Records without signed URLs: {data['records_without_signed_urls']}")
        print(f"   • Records with URLs: {data['records_with_urls']}")
        print(f"   • Records without URLs: {data['records_without_urls']}")
        
        # Calculate percentages
        total = data['total_records']
        if total > 0:
            signed_url_percentage = (data['records_with_signed_urls'] / total) * 100
            url_percentage = (data['records_with_urls'] / total) * 100
            print(f"   • Signed URL coverage: {signed_url_percentage:.1f}%")
            print(f"   • URL coverage: {url_percentage:.1f}%")
    
    print()


def check_file_type_breakdown():
    """Check file type breakdown."""
    print("📁 FILE TYPE BREAKDOWN")
    print("=" * 30)
    
    query = """
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
    """
    
    result = run_sql_query(query, "File type breakdown")
    if result:
        for row in result:
            print(f"   • {row['file_type']}: {row['count']} files")
    
    print()


def check_recent_records():
    """Check recent records."""
    print("🕒 RECENT RECORDS (Last 10)")
    print("=" * 35)
    
    query = """
    SELECT 
        id,
        part_number,
        file_name,
        created_at
    FROM part_images
    ORDER BY id DESC
    LIMIT 10
    """
    
    result = run_sql_query(query, "Recent records")
    if result:
        for row in result:
            print(f"   • ID: {row['id']} | {row['file_name']} | {row['part_number']}")
    
    print()


def check_records_without_signed_urls():
    """Check records without signed URLs."""
    print("⚠️ RECORDS WITHOUT SIGNED URLS")
    print("=" * 35)
    
    query = """
    SELECT 
        id,
        part_number,
        file_name,
        created_at
    FROM part_images
    WHERE signed_url IS NULL
    ORDER BY created_at DESC
    LIMIT 10
    """
    
    result = run_sql_query(query, "Records without signed URLs")
    if result:
        if len(result) == 0:
            print("   ✅ All records have signed URLs!")
        else:
            print(f"   Found {len(result)} records without signed URLs:")
            for row in result:
                print(f"      • {row['file_name']} (ID: {row['id']})")
    else:
        print("   ❌ Could not check records without signed URLs")
    
    print()


def check_duplicate_files():
    """Check for duplicate file names."""
    print("🔄 DUPLICATE FILE NAMES")
    print("=" * 25)
    
    query = """
    SELECT 
        file_name,
        COUNT(*) as duplicate_count
    FROM part_images
    GROUP BY file_name
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC
    LIMIT 10
    """
    
    result = run_sql_query(query, "Duplicate files")
    if result:
        if len(result) == 0:
            print("   ✅ No duplicate file names found!")
        else:
            print(f"   Found {len(result)} duplicate file names:")
            for row in result:
                print(f"      • {row['file_name']} ({row['duplicate_count']} copies)")
    else:
        print("   ❌ Could not check for duplicates")
    
    print()


def check_jpg_suffix_files():
    """Check files with _JPG or _jpg suffixes."""
    print("📸 FILES WITH _JPG/_jpg SUFFIXES")
    print("=" * 35)
    
    query = """
    SELECT 
        file_name,
        part_number,
        created_at
    FROM part_images
    WHERE file_name LIKE '%_JPG%' OR file_name LIKE '%_jpg%'
    ORDER BY file_name
    LIMIT 20
    """
    
    result = run_sql_query(query, "JPG suffix files")
    if result:
        print(f"   Found {len(result)} files with _JPG/_jpg suffixes:")
        for row in result:
            print(f"      • {row['file_name']}")
    else:
        print("   ❌ Could not check JPG suffix files")
    
    print()


def main():
    """Main function to check table status."""
    print("🔍 SOP Manager - Part Images Table Status Check")
    print("=" * 55)
    
    # Run all checks
    check_basic_table_info()
    check_file_type_breakdown()
    check_recent_records()
    check_records_without_signed_urls()
    check_duplicate_files()
    check_jpg_suffix_files()
    
    print("✅ Table status check completed!")


if __name__ == "__main__":
    main() 