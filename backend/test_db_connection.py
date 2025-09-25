#!/usr/bin/env python3
import os
import sys
from sqlalchemy import create_engine, text

def test_database_connection():
    """Test database connection and basic functionality."""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        return False
    
    print(f"🔗 Testing connection to: {database_url[:50]}...")
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            
            # Test if tables exist
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = [row[0] for row in result]
            
            if tables:
                print(f"📋 Found tables: {', '.join(tables)}")
            else:
                print("⚠️  No tables found in database")
            
            return True
            
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)
