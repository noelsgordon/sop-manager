import os
from supabase import create_client, Client
from urllib.parse import quote

# Step 1: Set up Supabase client
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"  # Must be service role for inserts
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

BUCKET_NAME = "part-images"

# Step 2: List files in the bucket
response = supabase.storage.from_(BUCKET_NAME).list()

# Step 3: Process each file
records = []
for file in response:
    file_name = file["name"]
    if file_name == "1.jpg":
        continue  # Skip placeholder

    # Extract part number from file name (e.g. '403-00017' from 'image103.png')
    part_number = os.path.splitext(file_name)[0]  # remove extension

    # Construct public URL
    encoded_file = quote(file_name)
    url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{encoded_file}"

    records.append({
        "part_number": part_number,
        "file_name": file_name,
        "url": url
    })

# Step 4: Insert into the table
for rec in records:
    supabase.table("part_images").upsert(rec, on_conflict="part_number").execute()

print(f"✅ Uploaded {len(records)} records to 'part_images' table.")
