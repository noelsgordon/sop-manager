import os
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client

# 🔐 Supabase credentials
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"  # ❗Must be service_role key (not anon)

BUCKET_NAME = "part-images"
TABLE_NAME = "part_images"

# 🔌 Connect to Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def list_all_files(bucket_name: str):
    return supabase.storage.from_(bucket_name).list()


def sync_and_sign_images():
    print("🔍 Scanning bucket...")

    # Step 1: List all files in the bucket
    files = list_all_files(BUCKET_NAME)
    if not files:
        print("⚠️ No files found in bucket.")
        return

    print(f"📦 Found {len(files)} files in bucket.")

    # Step 2: Get current entries in the DB
    existing = supabase.table(TABLE_NAME).select("file_name").execute()
    existing_files = set(row["file_name"] for row in existing.data)

    # Step 3: Filter new images
    new_files = []
    for file in files:
        name = file["name"]
        if not name.lower().endswith(".jpg"):
            continue
        if name not in existing_files:
            new_files.append(name)

    print(f"🆕 Found {len(new_files)} new .jpg files to insert...")

    # Step 4: Insert missing records
    for name in new_files:
        part_number = os.path.splitext(name)[0]
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{name}"
        supabase.table(TABLE_NAME).insert({
            "part_number": part_number,
            "file_name": name,
            "url": public_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        print(f"➕ Inserted: {name}")

    # Step 5: Regenerate signed URLs for all rows
    print("\n🔐 Updating signed URLs...")
    all_records = supabase.table(TABLE_NAME).select("*").execute().data
    updated = 0
    for row in all_records:
        file_name = row["file_name"]
        try:
            signed = supabase.storage.from_(BUCKET_NAME).create_signed_url(file_name, 60 * 60 * 24 * 7)
            if signed and signed.get("signedURL"):
                supabase.table(TABLE_NAME).update({
                    "signed_url": signed["signedURL"]
                }).eq("file_name", file_name).execute()
                print(f"🔗 Signed URL updated: {file_name}")
                updated += 1
        except Exception as e:
            print(f"❌ Error signing {file_name}: {e}")

    print(f"\n✅ Done. Inserted {len(new_files)} new rows and updated {updated} signed URLs.")


# Run it
sync_and_sign_images()
