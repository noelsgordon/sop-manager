import os
from supabase import create_client, Client
from datetime import datetime

# 🔧 Your Supabase project details
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"
BUCKET_NAME = "part-images"
TABLE_NAME = "part_images"

# 🧩 Init Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔎 Scanning bucket and syncing with 'part_images' table...")

# 1. Get all current entries from the table
existing_rows = supabase.table(TABLE_NAME).select("part_number").execute()
existing_part_numbers = {row["part_number"] for row in existing_rows.data}

# 2. Get all files in the bucket
bucket_files = supabase.storage.from_(BUCKET_NAME).list()

# 3. Filter only .jpg files
jpg_files = [f for f in bucket_files if f["name"].lower().endswith(".jpg")]

# 4. Identify which part numbers are missing from the table
new_rows = []
for f in jpg_files:
    file_name = f["name"]
    part_number = os.path.splitext(file_name)[0]

    if part_number not in existing_part_numbers:
        row = {
            "part_number": part_number,
            "file_name": file_name,
            "url": f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}",
            "created_at": datetime.utcnow().isoformat()
        }
        new_rows.append(row)

# 5. Bulk insert new records
if new_rows:
    supabase.table(TABLE_NAME).insert(new_rows).execute()
    print(f"✅ Added {len(new_rows)} missing entries to '{TABLE_NAME}' table.")
else:
    print("✅ No new entries needed. Table is up to date.")
