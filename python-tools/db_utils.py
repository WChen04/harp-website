#!/usr/bin/env python3
"""
Database utility functions for HARP website
Run this inside the python-tools Docker container
"""

import os
import psycopg2
import urllib.parse
from datetime import datetime

def get_db_connection():
    """Get database connection using environment variables."""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    parsed = urllib.parse.urlparse(database_url)
    
    connection_params = {
        "host": parsed.hostname,
        "database": parsed.path[1:],  # Remove leading slash
        "user": parsed.username,
        "password": parsed.password,
        "port": parsed.port or 5432,
        "sslmode": "require"
    }
    
    return psycopg2.connect(**connection_params)

def test_connection():
    """Test database connection and show basic stats."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"✅ Database connected successfully!")
        print(f"📊 PostgreSQL version: {version}")
        
        # Get table info
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cursor.fetchall()
        print(f"📋 Found {len(tables)} tables: {[t[0] for t in tables]}")
        
        # Get team member count
        cursor.execute("SELECT COUNT(*) FROM team_members")
        member_count = cursor.fetchone()[0]
        print(f"👥 Team members: {member_count}")
        
        # Get image stats
        cursor.execute("""
            SELECT 
                COUNT(*) as image_count,
                AVG(LENGTH(image_data)) as avg_size,
                SUM(LENGTH(image_data)) as total_size
            FROM team_member_images 
            WHERE image_data IS NOT NULL
        """)
        stats = cursor.fetchone()
        if stats[0] > 0:
            avg_mb = stats[1] / 1024 / 1024
            total_mb = stats[2] / 1024 / 1024
            print(f"🖼️  Images: {stats[0]} total, {avg_mb:.1f}MB average, {total_mb:.1f}MB total")
        else:
            print("🖼️  No images found")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🐍 HARP Website Database Utilities")
    print("=" * 40)
    test_connection() 