import os
import io
import requests
from PIL import Image
from supabase import create_client, Client

# 🧩 Supabase config
SUPABASE_URL = "https://gnbkzxcxsbtoynbgopkn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduYmt6eGN4c2J0b3luYmdvcGtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNzY2MSwiZXhwIjoyMDYyNjAzNjYxfQ.94mTjGxcu_dqrdmDbK-XlriQFqzbv396EuLqArGnhuw"

BUCKET_NAME = "part-images"

# 🔨 Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🚀 Script started")

# 🔍 List all files in the bucket
resp = supabase.storage.from_(BUCKET_NAME).list()
files = resp if isinstance(resp, list) else []

print(f"📂 Found {len(files)} files in '{BUCKET_NAME}'")

# 🔄 Convert and reupload non-JPGs
for file in files:
    file_name = file["name"]
    ext = os.path.splitext(file_name)[1].lower()

    if ext == ".jpg":
        print(f"✅ Already .jpg: {file_name}")
        continue

    try:
        # ⬇️ Download file
        url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
        response = requests.get(url)
        response.raise_for_status()

        # 🖼️ Try open image
        image = Image.open(io.BytesIO(response.content))
        rgb_image = image.convert("RGB")

        # 💾 Save as .jpg into memory
        converted_bytes = io.BytesIO()
        new_file_name = os.path.splitext(file_name)[0] + ".jpg"
        rgb_image.save(converted_bytes, format="JPEG")
        converted_bytes.seek(0)

        # ⬆️ Upload to Supabase
        supabase.storage.from_(BUCKET_NAME).upload(
            path=new_file_name,
            file=converted_bytes.getvalue(),
            file_options={"content-type": "image/jpeg"}
        )
        print(f"✅ Uploaded converted: {new_file_name}")

    except requests.HTTPError:
        print(f"❌ Failed to download: {file_name}")
    except IOError:
        print(f"❌ Skipping (not an image): {file_name} – cannot identify image file")
    except Exception as e:
        print(f"❌ Upload failed for {new_file_name}: {e}")
