#!/bin/bash

# Migrate Movie Explorer data to Railway PostgreSQL
set -e

echo "🚂 Movie Explorer: Migrating to Railway PostgreSQL"
echo "=================================================="

# Check if SQLite database exists
if [ ! -f "backend/dev.db" ]; then
    echo "❌ SQLite database (backend/dev.db) not found!"
    echo "Please ensure you have seeded data in SQLite first."
    exit 1
fi

# Check if Python virtual environment is available
if [ -z "$VIRTUAL_ENV" ]; then
    echo "📦 Activating Python virtual environment..."
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        echo "⚠️ No virtual environment found. Continuing with system Python..."
    fi
fi

# Install required dependencies
echo "📦 Installing required dependencies..."
pip install psycopg2-binary sqlalchemy

# Set the Railway database URL
echo "🔧 Setting up Railway connection..."
export RAILWAY_DATABASE_URL="postgresql://postgres:QVJBezVndLuZLdgcVHBdPBLhPeCmfSFU@roundhouse.proxy.rlwy.net:26680/railway"

# Run the migration
echo "🔄 Starting migration to Railway PostgreSQL..."
python migrate_to_railway.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Migration to Railway completed successfully!"
    echo ""
    echo "📊 Your Railway PostgreSQL database now contains:"
    echo "   ✅ All MovieLens movies (~1600)"
    echo "   ✅ All actors with TMDb data"
    echo "   ✅ All directors and genres"
    echo "   ✅ All relationships preserved"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Deploy your backend to Railway"
    echo "   2. Set DATABASE_URL in Railway backend service"
    echo "   3. Test your deployed API"
    echo ""
    echo "🔗 Railway Database Info:"
    echo "   Database: railway"
    echo "   User: postgres"
    echo "   Connection: Available in Railway dashboard"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
