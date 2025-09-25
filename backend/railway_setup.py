#!/usr/bin/env python3
"""
Railway deployment setup script for Movie Explorer Backend
This script handles database initialization and data seeding on Railway
"""

import os
import sys
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_railway_database():
    """Initialize database on Railway"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("❌ DATABASE_URL environment variable not set")
        return False
    
    try:
        # Import here to avoid import issues during Railway build
        from app.database import Base
        from app import models
        
        # Create engine
        engine = create_engine(database_url)
        
        # Create all tables
        logger.info("🔧 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Database setup failed: {e}")
        return False

def seed_railway_database():
    """Seed database with MovieLens data on Railway"""
    
    try:
        # Check if data directory exists
        data_dir = "/app/data"
        if not os.path.exists(data_dir):
            logger.warning(f"⚠️ Data directory {data_dir} not found")
            return False
        
        # Import seeder
        from seed_movielens_ml100k import main as seed_main
        
        # Run seeder
        logger.info("🌱 Starting database seeding...")
        seed_main()
        logger.info("✅ Database seeding completed")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Database seeding failed: {e}")
        return False

def check_existing_data():
    """Check if database already has data"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return False
    
    try:
        from app import models
        from app.database import SessionLocal
        
        db = SessionLocal()
        movie_count = db.query(models.Movie).count()
        db.close()
        
        logger.info(f"📊 Found {movie_count} movies in database")
        return movie_count > 0
        
    except Exception as e:
        logger.error(f"❌ Failed to check existing data: {e}")
        return False

def main():
    """Main Railway setup process"""
    
    logger.info("🚂 Railway deployment setup starting...")
    
    # Step 1: Setup database schema
    if not setup_railway_database():
        logger.error("Database setup failed")
        sys.exit(1)
    
    # Step 2: Check if we need to seed data
    if check_existing_data():
        logger.info("✅ Database already has data, skipping seeding")
    else:
        logger.info("📝 Database is empty, starting seeding process...")
        if not seed_railway_database():
            logger.warning("⚠️ Database seeding failed, but continuing...")
    
    logger.info("🎉 Railway setup completed successfully!")

if __name__ == "__main__":
    main()
