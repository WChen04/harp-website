import os
import psycopg2
from azure.storage.blob import BlobServiceClient, ContentSettings
from dotenv import load_dotenv

load_dotenv()

# Load from .env or define directly
NEON_DATABASE_URL = os.getenv("NEON_DATABASE_URL")
AZURE_CONNECTION_STRING = os.getenv("AZURE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")

# 1. Connect to Neon
def get_db_connection():
    return psycopg2.connect(NEON_DATABASE_URL)

# 2. Upload to Azure
def upload_to_azure(blob_service_client, container_name, blob_name, data, content_type):
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
    blob_client.upload_blob(data, overwrite=True, content_settings=ContentSettings(content_type=content_type))
    print(f"✅ Uploaded {blob_name} to Azure")

def main():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Change Table name and columns
    cursor.execute("SELECT image_id, file_name, image_data, mime_type FROM team_member_images")

    rows = cursor.fetchall()

    blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)

    for row in rows:
        record_id, image_name, image_data, image_type = row
        if not image_data or not image_name:
            continue

        try:
            upload_to_azure(blob_service_client, AZURE_CONTAINER_NAME, image_name, image_data, image_type)
        except Exception as e:
            print(f"❌ Error uploading {image_name}: {e}")

    cursor.close()
    conn.close()
    print("🎉 Migration complete.")

if __name__ == "__main__":
    main()
