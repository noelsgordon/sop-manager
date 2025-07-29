import os
import time
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

BUCKET_NAME = "part-images"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_all_bucket_files_with_pagination():
    """Get all files from bucket using proper pagination with options."""
    print("📋 Getting all bucket files with pagination...")
    all_files = []
    offset = 0
    limit = 100
    
    bucket = supabase.storage.from_(BUCKET_NAME)
    
    while True:
        try:
            # Create options object for pagination
            options = {
                'limit': limit,
                'offset': offset,
                'sortBy': {'column': 'name', 'order': 'asc'}
            }
            
            # Get files with pagination
            files = bucket.list(options=options)
            
            if not files:
                print(f"   No more files found at offset {offset}")
                break
            
            all_files.extend(files)
            print(f"   Retrieved {len(files)} files at offset {offset} (total: {len(all_files)})")
            
            # If we got fewer files than the limit, we've reached the end
            if len(files) < limit:
                print(f"   Reached end of files (got {len(files)} < {limit})")
                break
            
            offset += limit
            time.sleep(0.1)  # Small delay to avoid rate limiting
            
        except Exception as e:
            print(f"❌ Error getting files at offset {offset}: {e}")
            break
    
    print(f"📊 Total files retrieved: {len(all_files)}")
    return all_files


def check_file_exists_in_bucket(file_name):
    """Check if a specific file exists in the bucket."""
    try:
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 60)
        return signed and signed.get("signedURL")
    except Exception:
        return False


def analyze_remaining_duplicates():
    """Analyze the remaining duplicates to understand what they are."""
    print("🔍 Analyzing remaining duplicates...")
    print("=" * 50)
    
    # Get all files from bucket with pagination
    files = get_all_bucket_files_with_pagination()
    
    if not files:
        print("❌ No files found in bucket")
        return
    
    # Filter for JPG files
    jpg_files = [f["name"] for f in files if f["name"].lower().endswith('.jpg')]
    print(f"🖼️ Found {len(jpg_files)} JPG files")
    
    # Find remaining duplicates
    remaining_duplicates = []
    original_files = []
    orphaned_duplicates = []
    
    for file_name in jpg_files:
        # Check if this file has a _JPG or _jpg suffix
        if "_JPG.jpg" in file_name or "_jpg.jpg" in file_name:
            # Extract the original filename
            if "_JPG.jpg" in file_name:
                original_name = file_name.replace("_JPG.jpg", ".jpg")
            else:  # "_jpg.jpg"
                original_name = file_name.replace("_jpg.jpg", ".jpg")
            
            # Check if the original file exists
            if check_file_exists_in_bucket(original_name):
                remaining_duplicates.append(file_name)
                original_files.append(original_name)
                print(f"   Found duplicate: {file_name} -> {original_name}")
            else:
                orphaned_duplicates.append(file_name)
                print(f"   Found orphaned duplicate: {file_name} (no original: {original_name})")
    
    print(f"\n📊 REMAINING DUPLICATES ANALYSIS:")
    print(f"   • Total JPG files: {len(jpg_files)}")
    print(f"   • Remaining duplicates: {len(remaining_duplicates)}")
    print(f"   • Orphaned duplicates: {len(orphaned_duplicates)}")
    print(f"   • Original files: {len(original_files)}")
    
    # Analyze patterns in orphaned duplicates
    if orphaned_duplicates:
        print(f"\n📋 ORPHANED DUPLICATES ANALYSIS:")
        print(f"   Sample orphaned duplicates:")
        for i, dup in enumerate(orphaned_duplicates[:20], 1):
            print(f"   {i}. {dup}")
        if len(orphaned_duplicates) > 20:
            print(f"   ... and {len(orphaned_duplicates) - 20} more")
        
        # Check for patterns
        patterns = {}
        for dup in orphaned_duplicates:
            if "_JPG.jpg" in dup:
                pattern = dup.replace("_JPG.jpg", "")
                patterns[pattern] = patterns.get(pattern, 0) + 1
            elif "_jpg.jpg" in dup:
                pattern = dup.replace("_jpg.jpg", "")
                patterns[pattern] = patterns.get(pattern, 0) + 1
        
        print(f"\n📊 PATTERN ANALYSIS:")
        print(f"   • Unique base names: {len(patterns)}")
        print(f"   • Most common patterns:")
        sorted_patterns = sorted(patterns.items(), key=lambda x: x[1], reverse=True)
        for pattern, count in sorted_patterns[:10]:
            print(f"      • {pattern}: {count} duplicates")
    
    return remaining_duplicates, orphaned_duplicates


def main():
    """Main function to analyze remaining duplicates."""
    print("🚀 SOP Manager - Analyze Remaining Duplicates")
    print("=" * 60)
    
    # Analyze remaining duplicates
    remaining_duplicates, orphaned_duplicates = analyze_remaining_duplicates()
    
    print(f"\n" + "=" * 60)
    print("✅ Analysis complete!")
    print(f"📋 Summary:")
    print(f"   • Remaining duplicates: {len(remaining_duplicates)}")
    print(f"   • Orphaned duplicates: {len(orphaned_duplicates)}")
    
    if orphaned_duplicates:
        print(f"\n💡 RECOMMENDATION:")
        print(f"   The {len(orphaned_duplicates)} orphaned duplicates appear to be:")
        print(f"   • Files that were created with _JPG/_jpg suffixes")
        print(f"   • But their original versions were already deleted")
        print(f"   • These might be legitimate files that should be kept")
        print(f"   • Or they might be leftover duplicates that can be safely deleted")
        
        response = input(f"\n❓ Delete {len(orphaned_duplicates)} orphaned duplicates? (yes/no): ")
        if response.lower() == "yes":
            print(f"   Deleting orphaned duplicates...")
            # Add deletion logic here if needed
        else:
            print(f"   Keeping orphaned duplicates.")
    
    if remaining_duplicates:
        print(f"\n💡 RECOMMENDATION:")
        print(f"   The {len(remaining_duplicates)} remaining duplicates have original files.")
        print(f"   These should be deleted in a second cleanup run.")


if __name__ == "__main__":
    main() 