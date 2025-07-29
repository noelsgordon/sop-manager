import re
from supabase import create_client, Client

# 🔧 Supabase config
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"
BUCKET_NAME = "part-images"

# 🧩 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Checking for duplicate files...")

# 🔎 Regex to match names ending with (1), (2), etc. before extension
duplicate_pattern = re.compile(r"^(.*)\((\d+)\)\.(jpg|jpeg|png|webp)$", re.IGNORECASE)

# 📦 List all files in the bucket
files = supabase.storage.from_(BUCKET_NAME).list()

# 🗑️ Collect and delete duplicates
deleted_count = 0
for file in files:
    name = file["name"]
    if duplicate_pattern.match(name):
        supabase.storage.from_(BUCKET_NAME).remove([name])
        print(f"🗑️ Deleted duplicate: {name}")
        deleted_count += 1

print(f"\n✅ Cleanup complete. Deleted {deleted_count} duplicate file(s).")
