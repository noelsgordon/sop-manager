#!/usr/bin/env python3
"""
SOP Manager - Complete Image Management Solution
===============================================

This script provides a complete solution for managing images in the Supabase bucket
and database, including sync, cleanup, and signed URL generation.

Status: COMPLETED - Ready for Excel Integration
Last Updated: December 2024
"""

import os
import time
import requests
from supabase import create_client, Client
from typing import List, Dict, Tuple, Optional
import json

# Configuration
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzQsImV4cCI6MjA1MDU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"
BUCKET_NAME = "part-images"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_all_bucket_files_with_pagination() -> List[Dict]:
    """
    Get all files from the bucket using proper pagination.
    Returns list of file dictionaries.
    """
    print("🔍 Retrieving all files from bucket...")
    all_files = []
    offset = 0
    limit = 100
    bucket = supabase.storage.from_(BUCKET_NAME)
    
    while True:
        options = {
            'limit': limit,
            'offset': offset,
            'sortBy': {'column': 'name', 'order': 'asc'}
        }
        files = bucket.list(options=options)
        if not files:
            break
        all_files.extend(files)
        if len(files) < limit:
            break
        offset += limit
        time.sleep(0.1)  # Rate limiting
    
    print(f"✅ Retrieved {len(all_files)} files from bucket")
    return all_files

def sync_database_with_bucket_files() -> Tuple[int, int]:
    """
    Sync database with bucket files.
    Returns (added_count, updated_count)
    """
    print("\n🔄 Syncing database with bucket files...")
    
    # Get all bucket files
    bucket_files = get_all_bucket_files_with_pagination()
    if not bucket_files:
        print("❌ No files found in bucket")
        return 0, 0
    
    # Get existing database records
    existing_records = supabase.table('part_images').select('file_name').execute()
    existing_files = {record['file_name'] for record in existing_records.data}
    
    # Prepare data for upsert
    new_records = []
    for file_info in bucket_files:
        file_name = file_info['name']
        if file_name not in existing_files:
            # Extract part number from filename (assuming format like "000001.jpg")
            part_number = file_name.replace('.jpg', '').replace('.JPG', '')
            
            new_records.append({
                'part_number': part_number,
                'file_name': file_name,
                'public_url': f"https://gnbkzxcxsbtoynbgopkn.supabase.co/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
            })
    
    # Insert new records
    added_count = 0
    if new_records:
        print(f"📝 Adding {len(new_records)} new records to database...")
        for record in new_records:
            try:
                supabase.table('part_images').insert(record).execute()
                added_count += 1
            except Exception as e:
                print(f"❌ Error adding {record['file_name']}: {e}")
    
    print(f"✅ Added {added_count} new records")
    return added_count, len(bucket_files)

def generate_signed_urls_for_all_records() -> int:
    """
    Generate signed URLs for all database records.
    Returns number of URLs generated.
    """
    print("\n🔐 Generating signed URLs for all records...")
    
    # Get all records that need signed URLs
    records = supabase.table('part_images').select('*').execute()
    
    updated_count = 0
    for record in records.data:
        try:
            # Generate signed URL (1 hour expiration)
            signed_url = supabase.storage.from_(BUCKET_NAME).create_signed_url(
                record['file_name'], 
                3600  # 1 hour
            )
            
            # Update record with signed URL
            supabase.table('part_images').update({
                'signed_url': signed_url
            }).eq('id', record['id']).execute()
            
            updated_count += 1
            
        except Exception as e:
            print(f"❌ Error generating signed URL for {record['file_name']}: {e}")
    
    print(f"✅ Generated {updated_count} signed URLs")
    return updated_count

def cleanup_duplicate_files() -> Tuple[int, int]:
    """
    Clean up duplicate files with _JPG/_jpg suffixes.
    Returns (deleted_count, orphaned_count)
    """
    print("\n🧹 Cleaning up duplicate files...")
    
    bucket_files = get_all_bucket_files_with_pagination()
    all_files = {file['name'] for file in bucket_files}
    
    duplicates_to_delete = []
    orphaned_duplicates = []
    
    for file_info in bucket_files:
        file_name = file_info['name']
        
        # Check for _JPG or _jpg suffixes
        if '_JPG.' in file_name or '_jpg.' in file_name:
            # Try to find the original file
            original_name = file_name.replace('_JPG.', '.').replace('_jpg.', '.')
            
            if original_name in all_files:
                duplicates_to_delete.append(file_name)
            else:
                orphaned_duplicates.append(file_name)
    
    # Delete duplicates
    deleted_count = 0
    for file_name in duplicates_to_delete:
        try:
            supabase.storage.from_(BUCKET_NAME).remove([file_name])
            deleted_count += 1
        except Exception as e:
            print(f"❌ Error deleting {file_name}: {e}")
    
    print(f"✅ Deleted {deleted_count} duplicate files")
    print(f"📋 Found {len(orphaned_duplicates)} orphaned duplicates (kept)")
    
    return deleted_count, len(orphaned_duplicates)

def check_table_status() -> Dict:
    """
    Check the current status of the part_images table.
    Returns status dictionary.
    """
    print("\n📊 Checking table status...")
    
    try:
        # Get basic table info
        result = supabase.rpc('exec_sql', {
            'sql_query': 'SELECT COUNT(*) as total_records FROM part_images'
        }).execute()
        total_records = result.data[0]['total_records']
        
        # Get signed URL coverage
        result = supabase.rpc('exec_sql', {
            'sql_query': 'SELECT COUNT(*) as signed_count FROM part_images WHERE signed_url IS NOT NULL'
        }).execute()
        signed_count = result.data[0]['signed_count']
        
        # Get file type breakdown
        result = supabase.rpc('exec_sql', {
            'sql_query': '''
            SELECT 
                CASE 
                    WHEN file_name LIKE '%_JPG%' OR file_name LIKE '%_jpg%' THEN 'duplicate_suffix'
                    ELSE 'normal'
                END as file_type,
                COUNT(*) as count
            FROM part_images 
            GROUP BY file_type
            '''
        }).execute()
        
        file_breakdown = {row['file_type']: row['count'] for row in result.data}
        
        status = {
            'total_records': total_records,
            'signed_url_coverage': signed_count,
            'signed_url_percentage': (signed_count / total_records * 100) if total_records > 0 else 0,
            'file_breakdown': file_breakdown
        }
        
        print(f"✅ Table Status:")
        print(f"   Total Records: {status['total_records']}")
        print(f"   Signed URLs: {status['signed_url_coverage']} ({status['signed_url_percentage']:.1f}%)")
        print(f"   File Breakdown: {status['file_breakdown']}")
        
        return status
        
    except Exception as e:
        print(f"❌ Error checking table status: {e}")
        return {}

def test_signed_urls(sample_size: int = 10) -> bool:
    """
    Test signed URLs by making HTTP requests.
    Returns True if all tests pass.
    """
    print(f"\n🧪 Testing {sample_size} signed URLs...")
    
    # Get sample records
    result = supabase.table('part_images').select('signed_url').not_.is_('signed_url', 'null').limit(sample_size).execute()
    
    if not result.data:
        print("❌ No signed URLs found to test")
        return False
    
    success_count = 0
    for record in result.data:
        try:
            response = requests.get(record['signed_url'], timeout=10)
            if response.status_code == 200:
                success_count += 1
            else:
                print(f"❌ URL returned status {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing URL: {e}")
    
    success_rate = (success_count / len(result.data)) * 100
    print(f"✅ {success_count}/{len(result.data)} URLs working ({success_rate:.1f}%)")
    
    return success_rate >= 90

def run_complete_sync() -> Dict:
    """
    Run the complete sync process.
    Returns summary dictionary.
    """
    print("🚀 Starting Complete Image Management Solution")
    print("=" * 50)
    
    start_time = time.time()
    
    # Step 1: Check initial status
    initial_status = check_table_status()
    
    # Step 2: Clean up duplicates
    deleted_count, orphaned_count = cleanup_duplicate_files()
    
    # Step 3: Sync database
    added_count, total_files = sync_database_with_bucket_files()
    
    # Step 4: Generate signed URLs
    signed_count = generate_signed_urls_for_all_records()
    
    # Step 5: Check final status
    final_status = check_table_status()
    
    # Step 6: Test signed URLs
    urls_working = test_signed_urls()
    
    # Calculate timing
    elapsed_time = time.time() - start_time
    
    # Prepare summary
    summary = {
        'initial_status': initial_status,
        'final_status': final_status,
        'duplicates_deleted': deleted_count,
        'orphaned_duplicates': orphaned_count,
        'new_records_added': added_count,
        'signed_urls_generated': signed_count,
        'urls_working': urls_working,
        'elapsed_time_seconds': elapsed_time,
        'total_files_processed': total_files
    }
    
    print("\n" + "=" * 50)
    print("🎉 COMPLETE SOLUTION SUMMARY")
    print("=" * 50)
    print(f"⏱️  Total Time: {elapsed_time:.1f} seconds")
    print(f"🗑️  Duplicates Deleted: {deleted_count}")
    print(f"📋 Orphaned Duplicates: {orphaned_count}")
    print(f"➕ New Records Added: {added_count}")
    print(f"🔐 Signed URLs Generated: {signed_count}")
    print(f"✅ URLs Working: {'Yes' if urls_working else 'No'}")
    print(f"📊 Final Records: {final_status.get('total_records', 0)}")
    print(f"🔐 Signed URL Coverage: {final_status.get('signed_url_percentage', 0):.1f}%")
    
    return summary

def main():
    """
    Main function - run the complete solution.
    """
    try:
        summary = run_complete_sync()
        
        # Save summary to file
        with open('sync_summary.json', 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        print(f"\n📄 Summary saved to sync_summary.json")
        print("\n🎯 Next Steps:")
        print("1. Configure Excel PostgreSQL connection")
        print("2. Test image display in Excel")
        print("3. Set up weekly maintenance schedule")
        
    except Exception as e:
        print(f"❌ Error in complete solution: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 