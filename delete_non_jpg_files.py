import os
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

BUCKET_NAME = "part-images"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🚮 Starting cleanup of non-JPG files...")

files = supabase.storage.from_(BUCKET_NAME).list()

deleted = 0
for file in files:
    name = file["name"]
    ext = os.path.splitext(name)[1].lower()

    if ext != ".jpg":
        print(f"🗑️ Deleting: {name}")
        supabase.storage.from_(BUCKET_NAME).remove(name)
        deleted += 1

print(f"\n✅ Done. {deleted} non-JPG files deleted.")
