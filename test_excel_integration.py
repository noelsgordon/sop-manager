import os
import requests
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def test_signed_urls_for_excel():
    """Test signed URLs to ensure they work for Excel integration."""
    print("🔍 Testing Signed URLs for Excel Integration")
    print("=" * 50)
    
    # Get a sample of records with signed URLs
    try:
        result = supabase.table('part_images').select('part_number, file_name, signed_url').limit(10).execute()
        sample_records = result.data
        
        if not sample_records:
            print("❌ No records found to test")
            return
        
        print(f"📋 Testing {len(sample_records)} sample records...")
        print()
        
        working_count = 0
        failed_count = 0
        
        for i, record in enumerate(sample_records, 1):
            file_name = record['file_name']
            part_number = record['part_number']
            signed_url = record.get('signed_url')
            
            print(f"🔗 Test {i}: {file_name}")
            print(f"   Part Number: {part_number}")
            
            if not signed_url:
                print("   ❌ No signed URL found")
                failed_count += 1
                continue
            
            # Test the signed URL
            try:
                response = requests.get(signed_url, timeout=10)
                
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', 'unknown')
                    content_length = len(response.content)
                    
                    print(f"   ✅ Working (Status: {response.status_code})")
                    print(f"   📊 Content-Type: {content_type}")
                    print(f"   📏 Size: {content_length:,} bytes")
                    working_count += 1
                    
                    # Check if it's actually an image
                    if 'image' in content_type.lower():
                        print(f"   🖼️ Valid image file")
                    else:
                        print(f"   ⚠️ Not an image file")
                        
                else:
                    print(f"   ❌ Failed (Status: {response.status_code})")
                    failed_count += 1
                    
            except requests.exceptions.RequestException as e:
                print(f"   ❌ Network error: {e}")
                failed_count += 1
            
            print()
        
        # Summary
        print("=" * 50)
        print("📊 EXCEL INTEGRATION TEST RESULTS:")
        print(f"   • Total tested: {len(sample_records)}")
        print(f"   • Working URLs: {working_count}")
        print(f"   • Failed URLs: {failed_count}")
        print(f"   • Success rate: {(working_count/len(sample_records)*100):.1f}%")
        
        if working_count == len(sample_records):
            print("\n✅ ALL SIGNED URLS ARE WORKING!")
            print("🎯 Your Excel integration should work perfectly!")
        elif working_count > 0:
            print(f"\n⚠️ {working_count}/{len(sample_records)} URLs are working")
            print("🔧 Some URLs may need regeneration")
        else:
            print("\n❌ NO SIGNED URLS ARE WORKING!")
            print("🚨 Run 'python complete_solution.py' to regenerate URLs")
        
        return working_count, failed_count
        
    except Exception as e:
        print(f"❌ Error testing signed URLs: {e}")
        return 0, 0


def get_excel_ready_data():
    """Get data formatted for Excel integration."""
    print("\n📊 Getting Excel-Ready Data")
    print("=" * 40)
    
    try:
        # Get all records with signed URLs
        result = supabase.table('part_images').select('part_number, file_name, signed_url').execute()
        all_records = result.data
        
        if not all_records:
            print("❌ No records found")
            return
        
        records_with_signed_urls = [r for r in all_records if r.get('signed_url')]
        
        print(f"📋 Total records: {len(all_records)}")
        print(f"📋 Records with signed URLs: {len(records_with_signed_urls)}")
        print(f"📋 Records without signed URLs: {len(all_records) - len(records_with_signed_urls)}")
        
        # Show sample data for Excel
        print("\n📋 SAMPLE DATA FOR EXCEL:")
        print("Part Number | File Name | Signed URL")
        print("-" * 80)
        
        for i, record in enumerate(records_with_signed_urls[:5], 1):
            print(f"{record['part_number']} | {record['file_name']} | {record['signed_url'][:50]}...")
        
        if len(records_with_signed_urls) > 5:
            print(f"... and {len(records_with_signed_urls) - 5} more records")
        
        print(f"\n✅ Excel is ready to use {len(records_with_signed_urls)} images!")
        
    except Exception as e:
        print(f"❌ Error getting Excel data: {e}")


def main():
    """Main function to test Excel integration."""
    print("🎯 SOP Manager - Excel Integration Test")
    print("=" * 50)
    
    # Test signed URLs
    working, failed = test_signed_urls_for_excel()
    
    # Get Excel-ready data
    get_excel_ready_data()
    
    print("\n" + "=" * 50)
    print("📋 NEXT STEPS FOR EXCEL INTEGRATION:")
    print("1. Use the 'signed_url' column in your Excel queries")
    print("2. Set up weekly maintenance with 'python complete_solution.py'")
    print("3. Test image display in your Excel Kanban register")
    print("4. Monitor for expired URLs and regenerate as needed")
    
    if working > 0:
        print(f"\n✅ READY: {working} signed URLs are working for Excel!")
    else:
        print("\n❌ ISSUE: No signed URLs are working. Run maintenance script.")


if __name__ == "__main__":
    main() 