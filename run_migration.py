#!/usr/bin/env python3
"""
Direct migration script with your Railway URL
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

# Your Railway PostgreSQL URL
RAILWAY_URL = "postgresql://postgres:QVJBezVndLuZLdgcVHBdPBLhPeCmfSFU@turntable.proxy.rlwy.net:43003/railway"

def migrate_to_railway():
    """Migrate all data from SQLite to Railway PostgreSQL"""
    
    sqlite_path = "backend/dev.db"
    if not os.path.exists(sqlite_path):
        logger.error(f"❌ SQLite database not found: {sqlite_path}")
        return False
    
    try:
        # Connect to Railway PostgreSQL
        logger.info("🔧 Connecting to Railway PostgreSQL...")
        pg_engine = create_engine(RAILWAY_URL)
        
        # Test connection
        with pg_engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"✅ Connected to Railway: {version[:50]}...")
        
        # Import models and create tables
        sys.path.append(os.path.join(os.getcwd(), 'backend'))
        from app.database import Base
        from app import models
        
        logger.info("📋 Creating database tables...")
        Base.metadata.create_all(bind=pg_engine)
        
        # Connect to SQLite
        logger.info("📂 Reading SQLite database...")
        sqlite_conn = sqlite3.connect(sqlite_path)
        sqlite_conn.row_factory = sqlite3.Row
        
        # Create PostgreSQL session
        SessionLocal = sessionmaker(bind=pg_engine)
        pg_session = SessionLocal()
        
        # Migration order (important for foreign keys)
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
            
            # Get all data from SQLite table
            try:
                cursor = sqlite_conn.execute(f"SELECT * FROM {table}")
                rows = cursor.fetchall()
            except Exception as e:
                logger.warning(f"  ⚠️ Table {table} not found in SQLite: {e}")
                continue
            
            if not rows:
                logger.info(f"  📭 No data in {table}")
                continue
                
            columns = [desc[0] for desc in cursor.description]
            logger.info(f"  📊 Found {len(rows)} rows")
            
            # Insert each row into PostgreSQL
            success_count = 0
            for row in rows:
                try:
                    row_dict = dict(zip(columns, row))
                    
                    # Handle datetime conversion
                    for field in ['created_at', 'updated_at']:
                        if field in row_dict and row_dict[field]:
                            if isinstance(row_dict[field], str):
                                # Convert ISO string to datetime
                                row_dict[field] = datetime.fromisoformat(
                                    row_dict[field].replace('Z', '+00:00')
                                )
                    
                    # Prepare insert statement
                    cols = ', '.join(row_dict.keys())
                    placeholders = ', '.join([f":{key}" for key in row_dict.keys()])
                    
                    # Handle conflicts appropriately
                    if table in ['movie_genres', 'movie_actors']:
                        # Many-to-many junction tables
                        sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
                    else:
                        # Regular tables with ID primary key
                        sql = f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) ON CONFLICT (id) DO NOTHING"
                    
                    pg_session.execute(text(sql), row_dict)
                    success_count += 1
                    
                except Exception as e:
                    logger.warning(f"  ⚠️ Error migrating row in {table}: {e}")
                    continue
            
            # Commit all changes for this table
            pg_session.commit()
            total_migrated += success_count
            logger.info(f"  ✅ Successfully migrated {success_count}/{len(rows)} rows")
        
        # Verify the migration
        logger.info("🔍 Verifying migration results...")
        
        movie_count = pg_session.query(models.Movie).count()
        actor_count = pg_session.query(models.Actor).count()
        director_count = pg_session.query(models.Director).count()
        genre_count = pg_session.query(models.Genre).count()
        
        logger.info("📊 Final counts in Railway PostgreSQL:")
        logger.info(f"   🎬 Movies: {movie_count}")
        logger.info(f"   👨‍🎭 Actors: {actor_count}")
        logger.info(f"   🎭 Directors: {director_count}")
        logger.info(f"   🎨 Genres: {genre_count}")
        
        # Test relationships
        if movie_count > 0:
            sample_movie = pg_session.query(models.Movie).first()
            if sample_movie:
                logger.info(f"📽️ Sample movie: '{sample_movie.title}' ({sample_movie.release_year})")
                logger.info(f"   Director: {sample_movie.director.name if sample_movie.director else 'None'}")
                logger.info(f"   Actors: {len(sample_movie.actors)}")
                logger.info(f"   Genres: {len(sample_movie.genres)}")
        
        # Cleanup
        sqlite_conn.close()
        pg_session.close()
        
        # Success check
        if movie_count > 0:
            logger.info("🎉 Migration completed successfully!")
            logger.info(f"   Total records migrated: {total_migrated}")
            return True
        else:
            logger.error("❌ No movies found in Railway - migration may have failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    logger.info("🚂 Starting Migration to Railway PostgreSQL")
    logger.info("=" * 50)
    logger.info(f"Railway URL: {RAILWAY_URL[:50]}...")
    logger.info("")
    
    if migrate_to_railway():
        logger.info("")
        logger.info("🎉 SUCCESS! Your Movie Explorer data is now in Railway!")
        logger.info("")
        logger.info("📋 Next steps:")
        logger.info("   1. Deploy your backend to Railway")
        logger.info("   2. Set DATABASE_URL in Railway backend service to:")
        logger.info(f"      {RAILWAY_URL}")
        logger.info("   3. Test your deployed API endpoints")
        logger.info("   4. Update frontend to use Railway backend URL")
        logger.info("")
        logger.info("🔗 Your Railway PostgreSQL is ready for production!")
    else:
        logger.error("")
        logger.error("❌ Migration failed. Please check the error messages above.")

if __name__ == "__main__":
    main()
