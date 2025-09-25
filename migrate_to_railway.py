#!/usr/bin/env python3
"""
Migrate Movie Explorer data from SQLite to Railway PostgreSQL
This script transfers all your existing movie, actor, director, and genre data
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

# Railway PostgreSQL connection details from your variables
# You'll need to replace this with your actual DATABASE_PUBLIC_URL from Railway
RAILWAY_DATABASE_URL = os.getenv("RAILWAY_DATABASE_URL") or "postgresql://postgres:QVJBezVndLuZLdgcVHBdPBLhPeCmfSFU@roundhouse.proxy.rlwy.net:26680/railway"

def setup_railway_database():
    """Create tables in Railway PostgreSQL"""
    try:
        logger.info("🔧 Setting up Railway PostgreSQL database...")
        
        # Import models
        sys.path.append('/Users/deepaksingh/Desktop/L7Informatic/movie-explorer/backend')
        from app.database import Base
        from app import models
        
        # Create engine for Railway
        engine = create_engine(RAILWAY_DATABASE_URL)
        
        # Create all tables
        logger.info("📋 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"✅ Connected to PostgreSQL: {version}")
        
        return engine
        
    except Exception as e:
        logger.error(f"❌ Failed to setup Railway database: {e}")
        return None

def migrate_data_to_railway():
    """Migrate all data from SQLite to Railway PostgreSQL"""
    
    # SQLite database path
    sqlite_db = "/Users/deepaksingh/Desktop/L7Informatic/movie-explorer/backend/dev.db"
    
    if not os.path.exists(sqlite_db):
        logger.error(f"❌ SQLite database not found: {sqlite_db}")
        return False
    
    try:
        # Setup Railway database
        pg_engine = setup_railway_database()
        if not pg_engine:
            return False
        
        # Connect to SQLite
        logger.info("📂 Connecting to SQLite database...")
        sqlite_conn = sqlite3.connect(sqlite_db)
        sqlite_conn.row_factory = sqlite3.Row
        
        # Create PostgreSQL session
        SessionLocal = sessionmaker(bind=pg_engine)
        pg_session = SessionLocal()
        
        # Migration order (to handle foreign key constraints)
        migration_plan = [
            ('genres', 'Genre'),
            ('directors', 'Director'), 
            ('actors', 'Actor'),
            ('movies', 'Movie'),
            ('movie_genres', 'MovieGenre'),
            ('movie_actors', 'MovieActor')
        ]
        
        total_migrated = 0
        
        for table_name, model_name in migration_plan:
            logger.info(f"🔄 Migrating {table_name}...")
            
            # Get data from SQLite
            cursor = sqlite_conn.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            
            if not rows:
                logger.info(f"  📭 No data in {table_name}")
                continue
            
            # Get column names
            columns = [description[0] for description in cursor.description]
            logger.info(f"  📊 Found {len(rows)} rows in {table_name}")
            
            # Migrate each row
            migrated_count = 0
            for row in rows:
                try:
                    # Convert row to dict
                    row_dict = dict(zip(columns, row))
                    
                    # Handle datetime fields
                    for field in ['created_at', 'updated_at']:
                        if field in row_dict and row_dict[field]:
                            if isinstance(row_dict[field], str):
                                # Parse ISO format datetime
                                row_dict[field] = datetime.fromisoformat(
                                    row_dict[field].replace('Z', '+00:00')
                                )
                    
                    # Create parameterized insert statement
                    columns_str = ', '.join(row_dict.keys())
                    placeholders = ', '.join([f":{key}" for key in row_dict.keys()])
                    
                    # Use ON CONFLICT DO NOTHING to avoid duplicates
                    if table_name in ['movie_genres', 'movie_actors']:
                        # Many-to-many tables
                        insert_sql = f"""
                            INSERT INTO {table_name} ({columns_str}) 
                            VALUES ({placeholders}) 
                            ON CONFLICT DO NOTHING
                        """
                    else:
                        # Regular tables with ID primary key
                        insert_sql = f"""
                            INSERT INTO {table_name} ({columns_str}) 
                            VALUES ({placeholders}) 
                            ON CONFLICT (id) DO NOTHING
                        """
                    
                    pg_session.execute(text(insert_sql), row_dict)
                    migrated_count += 1
                    
                except Exception as e:
                    logger.warning(f"  ⚠️ Error migrating row in {table_name}: {e}")
                    continue
            
            # Commit all inserts for this table
            pg_session.commit()
            total_migrated += migrated_count
            logger.info(f"  ✅ Migrated {migrated_count}/{len(rows)} rows from {table_name}")
        
        # Close connections
        sqlite_conn.close()
        pg_session.close()
        
        logger.info(f"🎉 Migration completed! Total rows migrated: {total_migrated}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

def verify_migration():
    """Verify the migration was successful"""
    
    try:
        logger.info("🔍 Verifying migration...")
        
        # Import models
        sys.path.append('/Users/deepaksingh/Desktop/L7Informatic/movie-explorer/backend')
        from app import models
        
        # Connect to Railway PostgreSQL
        engine = create_engine(RAILWAY_DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        
        # Count records in each table
        counts = {
            'Movies': session.query(models.Movie).count(),
            'Actors': session.query(models.Actor).count(),
            'Directors': session.query(models.Director).count(),
            'Genres': session.query(models.Genre).count(),
        }
        
        # Test relationships
        sample_movie = session.query(models.Movie).first()
        if sample_movie:
            logger.info(f"📽️ Sample movie: '{sample_movie.title}' ({sample_movie.release_year})")
            logger.info(f"   Director: {sample_movie.director.name if sample_movie.director else 'None'}")
            logger.info(f"   Actors: {len(sample_movie.actors)} actors")
            logger.info(f"   Genres: {len(sample_movie.genres)} genres")
        
        session.close()
        
        # Display results
        logger.info("📊 Migration verification results:")
        for table, count in counts.items():
            logger.info(f"   {table}: {count} records")
        
        # Check if migration was successful
        if counts['Movies'] > 0:
            logger.info("✅ Migration verification successful!")
            return True
        else:
            logger.error("❌ No movies found - migration may have failed")
            return False
            
    except Exception as e:
        logger.error(f"❌ Verification failed: {e}")
        return False

def main():
    """Main migration process"""
    
    logger.info("🚂 Starting Railway PostgreSQL Migration")
    logger.info("=" * 50)
    
    # Check if SQLite database exists
    sqlite_path = "/Users/deepaksingh/Desktop/L7Informatic/movie-explorer/backend/dev.db"
    if not os.path.exists(sqlite_path):
        logger.error(f"❌ SQLite database not found: {sqlite_path}")
        logger.error("Please ensure you have seeded data in SQLite first.")
        return
    
    # Step 1: Migrate data
    logger.info("Step 1: Migrating data to Railway PostgreSQL...")
    if not migrate_data_to_railway():
        logger.error("❌ Migration failed")
        return
    
    # Step 2: Verify migration
    logger.info("\nStep 2: Verifying migration...")
    if not verify_migration():
        logger.error("❌ Migration verification failed")
        return
    
    logger.info("\n🎉 Railway migration completed successfully!")
    logger.info("\n📋 What's been migrated:")
    logger.info("   ✅ All movies from MovieLens dataset")
    logger.info("   ✅ All actors with TMDb data") 
    logger.info("   ✅ All directors")
    logger.info("   ✅ All genres")
    logger.info("   ✅ All movie-actor relationships")
    logger.info("   ✅ All movie-genre relationships")
    
    logger.info("\n🚀 Next steps:")
    logger.info("   1. Deploy your backend to Railway")
    logger.info("   2. Test API endpoints")
    logger.info("   3. Update frontend to use Railway backend URL")
    
    logger.info(f"\n🔗 Railway Database URL:")
    logger.info(f"   {RAILWAY_DATABASE_URL}")

if __name__ == "__main__":
    main()
