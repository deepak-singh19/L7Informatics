#!/usr/bin/env python3
"""
PostgreSQL setup and data migration script for Movie Explorer
"""

import os
import sqlite3
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_postgres_database():
    """Create PostgreSQL database and user if they don't exist"""
    
    # Default PostgreSQL connection (usually connects to 'postgres' database)
    admin_db_url = os.getenv("POSTGRES_ADMIN_URL", "postgresql://postgres:password@localhost:5432/postgres")
    target_db_name = os.getenv("POSTGRES_DB", "movie_explorer")
    target_user = os.getenv("POSTGRES_USER", "movie_user")
    target_password = os.getenv("POSTGRES_PASSWORD", "movie_password")
    
    try:
        # Connect to PostgreSQL as admin
        conn = psycopg2.connect(admin_db_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db_name,))
        if not cursor.fetchone():
            logger.info(f"Creating database: {target_db_name}")
            cursor.execute(f'CREATE DATABASE "{target_db_name}"')
        else:
            logger.info(f"Database {target_db_name} already exists")
        
        # Check if user exists
        cursor.execute("SELECT 1 FROM pg_user WHERE usename = %s", (target_user,))
        if not cursor.fetchone():
            logger.info(f"Creating user: {target_user}")
            cursor.execute(f"CREATE USER \"{target_user}\" WITH PASSWORD %s", (target_password,))
        else:
            logger.info(f"User {target_user} already exists")
        
        # Grant privileges
        cursor.execute(f'GRANT ALL PRIVILEGES ON DATABASE "{target_db_name}" TO "{target_user}"')
        
        cursor.close()
        conn.close()
        
        logger.info("✅ PostgreSQL database setup completed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to setup PostgreSQL: {e}")
        return False

def migrate_sqlite_to_postgres():
    """Migrate data from SQLite to PostgreSQL"""
    
    sqlite_db = "dev.db"
    postgres_url = os.getenv("DATABASE_URL", "postgresql://movie_user:movie_password@localhost:5432/movie_explorer")
    
    if not os.path.exists(sqlite_db):
        logger.error(f"❌ SQLite database {sqlite_db} not found")
        return False
    
    try:
        # Connect to SQLite
        sqlite_conn = sqlite3.connect(sqlite_db)
        sqlite_conn.row_factory = sqlite3.Row
        
        # Connect to PostgreSQL
        pg_engine = create_engine(postgres_url)
        
        # Create tables in PostgreSQL (using SQLAlchemy models)
        logger.info("Creating PostgreSQL tables...")
        from backend.app.database import Base
        Base.metadata.create_all(bind=pg_engine)
        
        # Create session
        SessionLocal = sessionmaker(bind=pg_engine)
        pg_session = SessionLocal()
        
        # Migrate each table
        tables = ['genres', 'directors', 'actors', 'movies', 'movie_genres', 'movie_actors']
        
        for table in tables:
            logger.info(f"Migrating table: {table}")
            
            # Get data from SQLite
            sqlite_cursor = sqlite_conn.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                logger.info(f"  No data in {table}")
                continue
            
            # Prepare column names
            columns = [description[0] for description in sqlite_cursor.description]
            
            # Insert into PostgreSQL
            for row in rows:
                # Convert row to dict
                row_dict = dict(zip(columns, row))
                
                # Handle datetime fields
                if 'created_at' in row_dict and row_dict['created_at']:
                    if isinstance(row_dict['created_at'], str):
                        row_dict['created_at'] = datetime.fromisoformat(row_dict['created_at'].replace('Z', '+00:00'))
                
                if 'updated_at' in row_dict and row_dict['updated_at']:
                    if isinstance(row_dict['updated_at'], str):
                        row_dict['updated_at'] = datetime.fromisoformat(row_dict['updated_at'].replace('Z', '+00:00'))
                
                # Create insert statement
                columns_str = ', '.join(row_dict.keys())
                placeholders = ', '.join([f":{key}" for key in row_dict.keys()])
                
                insert_sql = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
                
                try:
                    pg_session.execute(text(insert_sql), row_dict)
                except Exception as e:
                    logger.warning(f"  Warning inserting into {table}: {e}")
            
            pg_session.commit()
            logger.info(f"  ✅ Migrated {len(rows)} rows from {table}")
        
        sqlite_conn.close()
        pg_session.close()
        
        logger.info("✅ Data migration completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

def verify_migration():
    """Verify the migration was successful"""
    
    postgres_url = os.getenv("DATABASE_URL", "postgresql://movie_user:movie_password@localhost:5432/movie_explorer")
    
    try:
        engine = create_engine(postgres_url)
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        
        # Check row counts
        from backend.app import models
        
        movie_count = session.query(models.Movie).count()
        actor_count = session.query(models.Actor).count()
        director_count = session.query(models.Director).count()
        genre_count = session.query(models.Genre).count()
        
        logger.info("📊 Migration verification:")
        logger.info(f"  Movies: {movie_count}")
        logger.info(f"  Actors: {actor_count}")
        logger.info(f"  Directors: {director_count}")
        logger.info(f"  Genres: {genre_count}")
        
        session.close()
        
        if movie_count > 0:
            logger.info("✅ Migration verification successful")
            return True
        else:
            logger.error("❌ No movies found in PostgreSQL")
            return False
            
    except Exception as e:
        logger.error(f"❌ Verification failed: {e}")
        return False

def main():
    """Main migration process"""
    
    logger.info("🐘 Starting PostgreSQL setup and migration...")
    
    # Step 1: Setup PostgreSQL database
    if not setup_postgres_database():
        logger.error("Failed to setup PostgreSQL database")
        return
    
    # Step 2: Migrate data
    if not migrate_sqlite_to_postgres():
        logger.error("Failed to migrate data")
        return
    
    # Step 3: Verify migration
    if not verify_migration():
        logger.error("Migration verification failed")
        return
    
    logger.info("🎉 PostgreSQL setup and migration completed successfully!")
    logger.info("\n📋 Next steps:")
    logger.info("1. Update your .env file with PostgreSQL DATABASE_URL")
    logger.info("2. Restart your backend with the new database URL")
    logger.info("3. Test your application")

if __name__ == "__main__":
    main()
