#!/usr/bin/env python3
"""
Manual Railway Migration Script
Run this with your specific Railway DATABASE_PUBLIC_URL
"""

import os
import sys
import sqlite3
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_railway_url():
    """Get Railway URL from user input"""
    print("\n🔗 Please provide your Railway DATABASE_PUBLIC_URL:")
    print("   You can find this in Railway Dashboard → PostgreSQL Service → Connect tab")
    print("   It should look like: postgresql://postgres:PASSWORD@HOST:PORT/railway")
    print()
    
    railway_url = input("Enter your Railway DATABASE_PUBLIC_URL: ").strip()
    
    if not railway_url.startswith("postgresql://"):
        logger.error("❌ Invalid URL format. Should start with 'postgresql://'")
        return None
    
    return railway_url

def migrate_all_data(railway_url):
    """Migrate all data from SQLite to Railway"""
    
    sqlite_path = "backend/dev.db"
    if not os.path.exists(sqlite_path):
        logger.error(f"❌ SQLite database not found: {sqlite_path}")
        return False
    
    try:
        # Setup Railway connection
        logger.info("🔧 Connecting to Railway PostgreSQL...")
        pg_engine = create_engine(railway_url)
        
        # Test connection
        with pg_engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            logger.info("✅ Railway PostgreSQL connected successfully")
        
        # Import models and create tables
        sys.path.append(os.path.join(os.getcwd(), 'backend'))
        from app.database import Base
        from app import models
        
        logger.info("📋 Creating database tables...")
        Base.metadata.create_all(bind=pg_engine)
        
        # Connect to SQLite
        logger.info("📂 Reading from SQLite...")
        sqlite_conn = sqlite3.connect(sqlite_path)
        sqlite_conn.row_factory = sqlite3.Row
        
        # Create PostgreSQL session
        SessionLocal = sessionmaker(bind=pg_engine)
        pg_session = SessionLocal()
        
        # Migration plan (order matters for foreign keys)
        tables = [
            'genres',
            'directors', 
            'actors',
            'movies',
            'movie_genres',
            'movie_actors'
        ]
        
        total_migrated = 0
        
        for table in tables:
            logger.info(f"🔄 Migrating {table}...")
            
            # Get data from SQLite
            cursor = sqlite_conn.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            
            if not rows:
                logger.info(f"  📭 No data in {table}")
                continue
                
            columns = [desc[0] for desc in cursor.description]
            logger.info(f"  📊 Found {len(rows)} rows")
            
            # Insert data into PostgreSQL
            success_count = 0
            for row in rows:
                try:
                    row_dict = dict(zip(columns, row))
                    
                    # Handle datetime fields
                    for field in ['created_at', 'updated_at']:
                        if field in row_dict and row_dict[field]:
                            if isinstance(row_dict[field], str):
                                row_dict[field] = datetime.fromisoformat(
                                    row_dict[field].replace('Z', '+00:00')
                                )
                    
                    # Create insert statement
                    cols = ', '.join(row_dict.keys())
                    placeholders = ', '.join([f":{key}" for key in row_dict.keys()])
                    
                    if table in ['movie_genres', 'movie_actors']:
                        # Many-to-many tables
                        sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
                    else:
                        # Tables with primary key
                        sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) ON CONFLICT (id) DO NOTHING"
                    
                    pg_session.execute(text(sql), row_dict)
                    success_count += 1
                    
                except Exception as e:
                    logger.warning(f"  ⚠️ Error with row: {e}")
                    continue
            
            pg_session.commit()
            total_migrated += success_count
            logger.info(f"  ✅ Migrated {success_count}/{len(rows)} rows")
        
        # Verify migration
        logger.info("🔍 Verifying migration...")
        movie_count = pg_session.query(models.Movie).count()
        actor_count = pg_session.query(models.Actor).count()
        director_count = pg_session.query(models.Director).count()
        genre_count = pg_session.query(models.Genre).count()
        
        logger.info("📊 Migration results:")
        logger.info(f"   Movies: {movie_count}")
        logger.info(f"   Actors: {actor_count}")
        logger.info(f"   Directors: {director_count}")
        logger.info(f"   Genres: {genre_count}")
        
        # Test a sample movie
        sample_movie = pg_session.query(models.Movie).first()
        if sample_movie:
            logger.info(f"📽️ Sample: '{sample_movie.title}' with {len(sample_movie.actors)} actors")
        
        # Cleanup
        sqlite_conn.close()
        pg_session.close()
        
        if movie_count > 0:
            logger.info("🎉 Migration completed successfully!")
            return True
        else:
            logger.error("❌ No movies migrated")
            return False
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

def main():
    logger.info("🚂 Railway Migration Tool")
    logger.info("=" * 40)
    
    # Get Railway URL
    railway_url = get_railway_url()
    if not railway_url:
        return
    
    # Run migration
    logger.info("\n🔄 Starting migration...")
    if migrate_all_data(railway_url):
        logger.info("\n🎉 All your Movie Explorer data is now in Railway PostgreSQL!")
        logger.info("\n📋 Next steps:")
        logger.info("   1. Deploy your backend to Railway")
        logger.info("   2. Set DATABASE_URL in your backend service")
        logger.info("   3. Test your API endpoints")
    else:
        logger.error("\n❌ Migration failed. Please check the errors above.")

if __name__ == "__main__":
    main()
