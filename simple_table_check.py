import os
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_all_records():
    """Get all records from the part_images table."""
    print("📋 Getting all records from part_images table...")
    all_records = []
    offset = 0
    limit = 1000
    
    while True:
        try:
            result = supabase.table('part_images').select("*").range(offset, offset + limit - 1).execute()
            
            if not result.data:
                break
                
            all_records.extend(result.data)
            print(f"   Retrieved {len(result.data)} records at offset {offset} (total: {len(all_records)})")
            
            if len(result.data) < limit:
                break
                
            offset += limit
            
        except Exception as e:
            print(f"❌ Error fetching records: {e}")
            break
    
    print(f"📊 Total records retrieved: {len(all_records)}")
    return all_records


def analyze_table_data(records):
    """Analyze the table data."""
    print("\n📊 TABLE ANALYSIS")
    print("=" * 30)
    
    if not records:
        print("❌ No records found")
        return
    
    # Basic counts
    total_records = len(records)
    records_with_signed_urls = len([r for r in records if r.get('signed_url')])
    records_without_signed_urls = total_records - records_with_signed_urls
    records_with_urls = len([r for r in records if r.get('url')])
    records_without_urls = total_records - records_with_urls
    
    print(f"   • Total records: {total_records}")
    print(f"   • Records with signed URLs: {records_with_signed_urls}")
    print(f"   • Records without signed URLs: {records_without_signed_urls}")
    print(f"   • Records with URLs: {records_with_urls}")
    print(f"   • Records without URLs: {records_without_urls}")
    
    # Calculate percentages
    if total_records > 0:
        signed_url_percentage = (records_with_signed_urls / total_records) * 100
        url_percentage = (records_with_urls / total_records) * 100
        print(f"   • Signed URL coverage: {signed_url_percentage:.1f}%")
        print(f"   • URL coverage: {url_percentage:.1f}%")
    
    print()


def analyze_file_types(records):
    """Analyze file types."""
    print("📁 FILE TYPE BREAKDOWN")
    print("=" * 30)
    
    file_types = {}
    for record in records:
        file_name = record.get('file_name', '').lower()
        if file_name.endswith('.jpg') or file_name.endswith('.jpeg'):
            file_type = 'JPG'
        elif file_name.endswith('.png'):
            file_type = 'PNG'
        elif file_name.endswith('.gif'):
            file_type = 'GIF'
        elif file_name.endswith('.webp'):
            file_type = 'WEBP'
        else:
            file_type = 'OTHER'
        
        file_types[file_type] = file_types.get(file_type, 0) + 1
    
    for file_type, count in sorted(file_types.items(), key=lambda x: x[1], reverse=True):
        print(f"   • {file_type}: {count} files")
    
    print()


def show_recent_records(records):
    """Show recent records."""
    print("🕒 RECENT RECORDS (Last 10)")
    print("=" * 35)
    
    # Sort by ID (assuming ID is auto-increment)
    sorted_records = sorted(records, key=lambda x: x.get('id', 0), reverse=True)
    
    for record in sorted_records[:10]:
        record_id = record.get('id', 'N/A')
        file_name = record.get('file_name', 'N/A')
        part_number = record.get('part_number', 'N/A')
        print(f"   • ID: {record_id} | {file_name} | {part_number}")
    
    print()


def check_records_without_signed_urls(records):
    """Check records without signed URLs."""
    print("⚠️ RECORDS WITHOUT SIGNED URLS")
    print("=" * 35)
    
    records_without_signed_urls = [r for r in records if not r.get('signed_url')]
    
    if not records_without_signed_urls:
        print("   ✅ All records have signed URLs!")
    else:
        print(f"   Found {len(records_without_signed_urls)} records without signed URLs:")
        for record in records_without_signed_urls[:10]:  # Show first 10
            print(f"      • {record.get('file_name', 'N/A')} (ID: {record.get('id', 'N/A')})")
        if len(records_without_signed_urls) > 10:
            print(f"      ... and {len(records_without_signed_urls) - 10} more")
    
    print()


def check_duplicate_files(records):
    """Check for duplicate file names."""
    print("🔄 DUPLICATE FILE NAMES")
    print("=" * 25)
    
    file_name_counts = {}
    for record in records:
        file_name = record.get('file_name')
        if file_name:
            file_name_counts[file_name] = file_name_counts.get(file_name, 0) + 1
    
    duplicates = {name: count for name, count in file_name_counts.items() if count > 1}
    
    if not duplicates:
        print("   ✅ No duplicate file names found!")
    else:
        print(f"   Found {len(duplicates)} duplicate file names:")
        for file_name, count in sorted(duplicates.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"      • {file_name} ({count} copies)")
    
    print()


def check_jpg_suffix_files(records):
    """Check files with _JPG or _jpg suffixes."""
    print("📸 FILES WITH _JPG/_jpg SUFFIXES")
    print("=" * 35)
    
    jpg_suffix_files = [r for r in records if r.get('file_name', '').upper().find('_JPG') != -1]
    
    if not jpg_suffix_files:
        print("   ✅ No files with _JPG/_jpg suffixes found!")
    else:
        print(f"   Found {len(jpg_suffix_files)} files with _JPG/_jpg suffixes:")
        for record in jpg_suffix_files[:20]:  # Show first 20
            print(f"      • {record.get('file_name', 'N/A')}")
        if len(jpg_suffix_files) > 20:
            print(f"      ... and {len(jpg_suffix_files) - 20} more")
    
    print()


def main():
    """Main function to check table status."""
    print("🔍 SOP Manager - Part Images Table Status Check")
    print("=" * 55)
    print()
    
    # Get all records
    records = get_all_records()
    
    if not records:
        print("❌ No records found in the table")
        return
    
    # Run all analyses
    analyze_table_data(records)
    analyze_file_types(records)
    show_recent_records(records)
    check_records_without_signed_urls(records)
    check_duplicate_files(records)
    check_jpg_suffix_files(records)
    
    print("✅ Table status check completed!")


if __name__ == "__main__":
    main() 