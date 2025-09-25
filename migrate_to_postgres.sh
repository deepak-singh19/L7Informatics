#!/bin/bash

# Migration script from SQLite to PostgreSQL
set -e

echo "🐘 Movie Explorer: SQLite to PostgreSQL Migration"
echo "================================================"

# Check if required files exist
if [ ! -f "backend/dev.db" ]; then
    echo "❌ SQLite database (backend/dev.db) not found!"
    echo "Please ensure you have seeded data in SQLite first."
    exit 1
fi

# Check if Python virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "📦 Activating Python virtual environment..."
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        echo "❌ Virtual environment not found. Please create one:"
        echo "python -m venv venv && source venv/bin/activate && pip install -r backend/requirements.txt"
        exit 1
    fi
fi

# Install required dependencies
echo "📦 Installing required dependencies..."
pip install psycopg2-binary

# Step 1: Start PostgreSQL with Docker
echo "🐘 Starting PostgreSQL database..."
docker-compose -f docker-compose.postgres.yml up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Wait for PostgreSQL to be ready
echo "🔍 Checking PostgreSQL connection..."
for i in {1..30}; do
    if docker exec movie-explorer-postgres pg_isready -U movie_user -d movie_explorer >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL did not start in time"
        exit 1
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

# Step 2: Set environment variables
echo "🔧 Setting up environment..."
export DATABASE_URL="postgresql://movie_user:movie_password@localhost:5432/movie_explorer"
export POSTGRES_ADMIN_URL="postgresql://postgres:postgres@localhost:5432/postgres"
export POSTGRES_DB="movie_explorer"
export POSTGRES_USER="movie_user"
export POSTGRES_PASSWORD="movie_password"

# Step 3: Run migration
echo "🔄 Running migration script..."
cd backend
python ../setup_postgres.py

# Step 4: Test the new PostgreSQL backend
echo "🧪 Testing PostgreSQL backend..."
cd ..

# Start backend with PostgreSQL
echo "🚀 Starting backend with PostgreSQL..."
cd backend
export DATABASE_URL="postgresql://movie_user:movie_password@localhost:5432/movie_explorer"
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Test API endpoint
echo "🔍 Testing API..."
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend is running with PostgreSQL!"
    
    # Test movie endpoint
    movie_count=$(curl -s http://localhost:8000/movies | python -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✅ Found $movie_count movies in PostgreSQL"
else
    echo "❌ Backend failed to start with PostgreSQL"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Kill the test backend
kill $BACKEND_PID 2>/dev/null || true

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📋 What's been done:"
echo "   ✅ PostgreSQL database created"
echo "   ✅ Data migrated from SQLite"
echo "   ✅ Backend tested with PostgreSQL"
echo ""
echo "📍 Your PostgreSQL database is running at:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: movie_explorer"
echo "   User: movie_user"
echo "   Password: movie_password"
echo ""
echo "🔧 Next steps:"
echo "   1. Update your .env file with:"
echo "      DATABASE_URL=postgresql://movie_user:movie_password@localhost:5432/movie_explorer"
echo ""
echo "   2. Restart your backend:"
echo "      cd backend"
echo "      export DATABASE_URL=postgresql://movie_user:movie_password@localhost:5432/movie_explorer"
echo "      uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
echo ""
echo "   3. Access pgAdmin (optional): http://localhost:5050"
echo "      Email: admin@movieexplorer.com"
echo "      Password: admin123"
echo ""
echo "🚀 Your Movie Explorer is now ready for production with PostgreSQL!"
