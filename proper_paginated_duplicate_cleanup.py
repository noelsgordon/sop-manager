import os
import time
from supabase import create_client, Client
from typing import List, Dict, Any

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


def get_all_bucket_files_simple():
    """Get all files from bucket using simple approach (fallback)."""
    print("📋 Getting bucket files using simple approach...")
    
    bucket = supabase.storage.from_(BUCKET_NAME)
    
    try:
        # Try to get all files at once
        files = bucket.list()
        print(f"   Retrieved {len(files)} files in single request")
        return files
    except Exception as e:
        print(f"❌ Error listing files: {e}")
        return []


def check_file_exists_in_bucket(file_name):
    """Check if a specific file exists in the bucket."""
    try:
        signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 60)
        return signed and signed.get("signedURL")
    except Exception:
        return False


def find_duplicates_with_pagination():
    """Find duplicate files with _JPG or _jpg suffixes using pagination."""
    print("🔍 Finding duplicate files with pagination...")
    print("=" * 50)
    
    # Get all files from bucket with pagination
    files = get_all_bucket_files_with_pagination()
    
    if not files:
        print("❌ No files found in bucket")
        return [], []
    
    # Filter for JPG files
    jpg_files = [f["name"] for f in files if f["name"].lower().endswith('.jpg')]
    print(f"🖼️ Found {len(jpg_files)} JPG files")
    
    # Find duplicates
    duplicates_to_delete = []
    original_files = []
    
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
                duplicates_to_delete.append(file_name)
                original_files.append(original_name)
                print(f"   Found duplicate: {file_name} -> {original_name}")
    
    print(f"\n📊 DUPLICATE ANALYSIS:")
    print(f"   • Total JPG files: {len(jpg_files)}")
    print(f"   • Duplicates found: {len(duplicates_to_delete)}")
    print(f"   • Original files: {len(original_files)}")
    
    return duplicates_to_delete, original_files


def delete_duplicates(duplicates_to_delete):
    """Delete the duplicate files."""
    print(f"\n🗑️ Deleting {len(duplicates_to_delete)} duplicate files...")
    print("=" * 50)
    
    deleted_count = 0
    failed_count = 0
    
    for i, file_name in enumerate(duplicates_to_delete, 1):
        try:
            # Delete the file from bucket
            supabase.storage.from_(BUCKET_NAME).remove([file_name])
            print(f"   ✅ Deleted: {file_name}")
            deleted_count += 1
            time.sleep(0.05)  # Small delay to avoid rate limiting
            
        except Exception as e:
            print(f"   ❌ Failed to delete {file_name}: {e}")
            failed_count += 1
    
    print(f"\n📊 DELETION SUMMARY:")
    print(f"   • Successfully deleted: {deleted_count}")
    print(f"   • Failed deletions: {failed_count}")
    
    return deleted_count, failed_count


def verify_cleanup():
    """Verify that duplicates have been removed."""
    print("\n🔍 Verifying cleanup...")
    print("=" * 30)
    
    # Get files again
    files = get_all_bucket_files_with_pagination()
    jpg_files = [f["name"] for f in files if f["name"].lower().endswith('.jpg')]
    
    # Check for remaining duplicates
    remaining_duplicates = []
    for file_name in jpg_files:
        if "_JPG.jpg" in file_name or "_jpg.jpg" in file_name:
            remaining_duplicates.append(file_name)
    
    print(f"📊 VERIFICATION RESULTS:")
    print(f"   • Total JPG files after cleanup: {len(jpg_files)}")
    print(f"   • Remaining duplicates: {len(remaining_duplicates)}")
    
    if remaining_duplicates:
        print(f"   ⚠️ Remaining duplicates:")
        for dup in remaining_duplicates[:10]:
            print(f"      • {dup}")
        if len(remaining_duplicates) > 10:
            print(f"      ... and {len(remaining_duplicates) - 10} more")
    else:
        print("   ✅ No remaining duplicates found!")
    
    return len(remaining_duplicates) == 0


def main():
    """Main function to cleanup duplicates with proper pagination."""
    print("🚀 SOP Manager - Duplicate File Cleanup (Paginated)")
    print("=" * 60)
    
    # Step 1: Find duplicates with pagination
    print("\n📋 Step 1: Finding duplicates with pagination...")
    duplicates_to_delete, original_files = find_duplicates_with_pagination()
    
    if not duplicates_to_delete:
        print("✅ No duplicates found!")
        return
    
    # Step 2: Show what will be deleted
    print(f"\n📋 Step 2: Reviewing duplicates to delete...")
    print(f"   Found {len(duplicates_to_delete)} duplicates to delete:")
    for i, dup in enumerate(duplicates_to_delete[:10], 1):
        print(f"   {i}. {dup}")
    if len(duplicates_to_delete) > 10:
        print(f"   ... and {len(duplicates_to_delete) - 10} more")
    
    # Step 3: Confirm deletion
    response = input(f"\n❓ Delete {len(duplicates_to_delete)} duplicate files? (yes/no): ")
    if response.lower() != "yes":
        print("❌ Deletion cancelled.")
        return
    
    # Step 4: Delete duplicates
    print(f"\n📋 Step 3: Deleting duplicates...")
    deleted_count, failed_count = delete_duplicates(duplicates_to_delete)
    
    # Step 5: Verify cleanup
    print(f"\n📋 Step 4: Verifying cleanup...")
    cleanup_successful = verify_cleanup()
    
    print("\n" + "=" * 60)
    if cleanup_successful:
        print("✅ Duplicate cleanup completed successfully!")
        print(f"   • Deleted {deleted_count} duplicate files")
        print(f"   • Failed deletions: {failed_count}")
    else:
        print("⚠️ Cleanup completed with some issues")
        print(f"   • Deleted {deleted_count} duplicate files")
        print(f"   • Failed deletions: {failed_count}")
        print(f"   • Some duplicates may remain")


if __name__ == "__main__":
    main() 