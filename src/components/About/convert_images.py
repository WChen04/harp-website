import os
import psycopg2
from datetime import datetime
import urllib.parse
from PIL import Image
import io

def get_team_member_image_paths(cursor):
    """Get mapping of team member IDs to their image paths from the team_members table."""
    cursor.execute("SELECT id, image_path FROM team_members")
    return {row[1]: row[0] for row in cursor.fetchall() if row[1]}

def get_db_params_from_url(database_url):
    """Parse DATABASE_URL into connection parameters."""
    parsed = urllib.parse.urlparse(database_url)
    
    return {
        "host": parsed.hostname,
        "database": parsed.path[1:],  # Remove the leading slash
        "user": parsed.username,
        "password": parsed.password,
        "port": parsed.port or 5432,
        "sslmode": "require"
    }

def compress_image(image_path, max_size=(1000, 1000), quality=85):
    """
    Compress image to reduce storage size.
    
    - Resizes large images (max 1000px width/height)
    - Uses lossless compression for PNG
    - Uses lossy compression (85% quality) for JPEG
    """
    with Image.open(image_path) as img:
        img.thumbnail(max_size)  # Resize while maintaining aspect ratio

        img_io = io.BytesIO()
        file_ext = os.path.splitext(image_path)[1].lower()

        if file_ext in [".jpg", ".jpeg"]:
            img = img.convert("RGB")  # Required for JPEG
            img.save(img_io, format="JPEG", quality=quality, optimize=True)
        elif file_ext == ".png":
            img.save(img_io, format="PNG", optimize=True)  # Keep original transparency
        else:
            img.save(img_io, format="JPEG", quality=quality, optimize=True)  # Default to JPEG
        
        return img_io.getvalue()

def insert_team_member_images(database_url, base_dir):
    """Insert team member images into PostgreSQL database with compression."""
    db_params = get_db_params_from_url(database_url)
    conn = psycopg2.connect(**db_params)
    cursor = conn.cursor()
    
    try:
        team_member_paths = get_team_member_image_paths(cursor)
        success_count, failure_count = 0, 0
        
        for image_path, team_member_id in team_member_paths.items():
            full_path = os.path.join(base_dir, image_path)
            
            if not os.path.exists(full_path):
                print(f"File not found: {full_path}")
                failure_count += 1
                continue
                
            try:
                # Compress image before storing
                image_data = compress_image(full_path)

                filename = os.path.basename(image_path)
                extension = filename.split('.')[-1].lower()
                mime_types = {
                    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                    'png': 'image/png', 'gif': 'image/gif',
                    'bmp': 'image/bmp', 'tiff': 'image/tiff',
                    'webp': 'image/webp'
                }
                mime_type = mime_types.get(extension, 'application/octet-stream')

                cursor.execute(
                    """
                    INSERT INTO team_member_images 
                    (team_member_id, image_data, mime_type, file_name, upload_date) 
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (team_member_id) 
                    DO UPDATE SET 
                        image_data = EXCLUDED.image_data,
                        mime_type = EXCLUDED.mime_type,
                        file_name = EXCLUDED.file_name,
                        upload_date = EXCLUDED.upload_date
                    """,
                    (team_member_id, psycopg2.Binary(image_data), mime_type, filename, datetime.now())
                )

                conn.commit()  # Commit per image
                success_count += 1
                print(f"Processed: {filename} for member ID {team_member_id}")

            except psycopg2.Error as e:
                conn.rollback()  # Rollback on error
                print(f"Database error processing {image_path}: {e.pgcode} - {e.pgerror}")
                failure_count += 1

            except Exception as e:
                print(f"Unexpected error processing {image_path}: {e}")
                failure_count += 1
        
        print(f"Import complete. Success: {success_count}, Failures: {failure_count}")

    except Exception as e:
        conn.rollback()
        print(f"Fatal database error: {e}")
        raise
    
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    database_url = os.environ.get("DATABASE_URL", "postgresql://neondb_owner:npg_Smk0xKOUh5TH@ep-green-dream-a51jl7mj-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require")  # Use environment variable
    base_dir = ""  # Set your base directory here
    insert_team_member_images(database_url, base_dir)
