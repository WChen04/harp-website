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
        "database": parsed.path[1:],
        "user": parsed.username,
        "password": parsed.password,
        "port": parsed.port or 5432,
        "sslmode": "require"
    }

def optimize_image(image_path, max_size=(500, 500), quality=75):
    """
    OPTIMIZED image compression for web delivery:
    
    - Smaller max size: 500×500 pixels (was 1000×1000)
    - Lower quality: 75% (was 85%)
    - Progressive JPEG encoding
    - WebP format support (50% smaller than JPEG)
    """
    with Image.open(image_path) as img:
        # Convert to RGB if necessary (for JPEG compatibility)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background for transparent images
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Resize with high-quality resampling
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        img_io = io.BytesIO()
        file_ext = os.path.splitext(image_path)[1].lower()
        
        # Prefer WebP format for best compression
        if file_ext in [".webp"]:
            img.save(img_io, format="WebP", quality=quality, optimize=True)
            mime_type = "image/webp"
        elif file_ext in [".jpg", ".jpeg"]:
            img.save(img_io, format="JPEG", quality=quality, optimize=True, progressive=True)
            mime_type = "image/jpeg"
        elif file_ext == ".png":
            # For PNG, convert to JPEG if no transparency needed
            img.save(img_io, format="JPEG", quality=quality, optimize=True, progressive=True)
            mime_type = "image/jpeg"
        else:
            # Default to JPEG with optimization
            img.save(img_io, format="JPEG", quality=quality, optimize=True, progressive=True)
            mime_type = "image/jpeg"
        
        return img_io.getvalue(), mime_type

def insert_optimized_team_member_images(database_url, base_dir):
    """Insert team member images with AGGRESSIVE optimization."""
    db_params = get_db_params_from_url(database_url)
    conn = psycopg2.connect(**db_params)
    cursor = conn.cursor()
    
    try:
        team_member_paths = get_team_member_image_paths(cursor)
        success_count, failure_count = 0, 0
        total_size_before = 0
        total_size_after = 0
        
        for image_path, team_member_id in team_member_paths.items():
            full_path = os.path.join(base_dir, image_path)
            
            if not os.path.exists(full_path):
                print(f"File not found: {full_path}")
                failure_count += 1
                continue
                
            try:
                # Get original file size
                original_size = os.path.getsize(full_path)
                total_size_before += original_size
                
                # Optimize image aggressively
                image_data, mime_type = optimize_image(full_path, max_size=(500, 500), quality=70)
                optimized_size = len(image_data)
                total_size_after += optimized_size
                
                filename = os.path.basename(image_path)
                
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

                conn.commit()
                success_count += 1
                
                # Show compression stats
                compression_ratio = (1 - optimized_size / original_size) * 100
                print(f"✅ {filename}: {original_size//1024}KB → {optimized_size//1024}KB ({compression_ratio:.1f}% reduction)")

            except psycopg2.Error as e:
                conn.rollback()
                print(f"❌ Database error processing {image_path}: {e}")
                failure_count += 1

            except Exception as e:
                print(f"❌ Error processing {image_path}: {e}")
                failure_count += 1
        
        # Show final stats
        total_reduction = (1 - total_size_after / total_size_before) * 100 if total_size_before > 0 else 0
        print(f"\n🎉 OPTIMIZATION COMPLETE:")
        print(f"   📊 Success: {success_count}, Failures: {failure_count}")
        print(f"   📉 Total size: {total_size_before//1024//1024}MB → {total_size_after//1024//1024}MB")
        print(f"   🚀 Overall reduction: {total_reduction:.1f}%")

    except Exception as e:
        conn.rollback()
        print(f"❌ Fatal database error: {e}")
        raise
    
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    database_url = os.environ.get("DATABASE_URL", "postgresql://neondb_owner:npg_Smk0xKOUh5TH@ep-green-dream-a51jl7mj-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require")
    base_dir = ""  # Set your base directory here
    
    print("🔄 Starting AGGRESSIVE image optimization...")
    print("   📐 Target size: 500×500 pixels (was 1000×1000)")
    print("   📉 Quality: 70% (was 85%)")
    print("   🖼️  Format: Progressive JPEG")
    print()
    
    insert_optimized_team_member_images(database_url, base_dir) 