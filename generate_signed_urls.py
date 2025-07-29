
import os
import datetime
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"  # ❗Must be service_role key (not anon)

BUCKET_NAME = "part-images"
EXPIRY_SECONDS = 60 * 60 * 24 * 7  # 7 days

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def list_all_files(bucket_name, prefix="", limit=100):
    files = []
    offset = 0
    while True:
        batch = supabase.storage.from_(bucket_name).list(prefix=prefix, limit=limit, offset=offset)
        if not batch:
            break
        files.extend(batch)
        offset += limit
    return files

def sync_and_sign_images():
    print("🔍 Scanning bucket...")
    files = list_all_files(BUCKET_NAME)
    print(f"📦 Found {len(files)} files.")

    existing_rows = supabase.table("part_images").select("file_name").execute().data
    existing_files = set(r["file_name"] for r in existing_rows)

    added = 0
    updated = 0

    for f in files:
        name = f["name"]
        if not name.lower().endswith(".jpg"):
            continue

        part_number = os.path.splitext(name)[0]
        created_at = datetime.datetime.utcnow().isoformat()

        # Insert if missing
        if name not in existing_files:
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{name}"
            supabase.table("part_images").insert({
                "part_number": part_number,
                "file_name": name,
                "url": public_url,
                "created_at": created_at
            }).execute()
            print(f"➕ Inserted {name}")
            added += 1

        # Create signed URL
        try:
            signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(
                path=name,
                expires_in=EXPIRY_SECONDS
            )
            signed_url = signed.get("signedURL")
            if signed_url:
                supabase.table("part_images").update({
                    "signed_url": signed_url
                }).eq("file_name", name).execute()
                print(f"🔐 Signed URL updated: {name}")
                updated += 1
        except Exception as e:
            print(f"❌ Error signing {name}: {e}")

    print(f"\n✅ Added {added} new entries")
    print(f"🔄 Updated {updated} signed URLs")

# Run it
sync_and_sign_images()
