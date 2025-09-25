#!/bin/bash

# Movie Explorer Deployment Script
# Usage: ./deploy.sh [local|production]

set -e

MODE=${1:-local}
PROJECT_NAME="movie-explorer"

echo "🚀 Deploying Movie Explorer in $MODE mode..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 No .env file found. Creating from example..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Created .env file. Please edit it with your values before continuing."
        echo "Press Enter when ready to continue..."
        read
    else
        echo "❌ No env.example file found. Please create a .env file manually."
        exit 1
    fi
fi

# Load environment variables
source .env

case $MODE in
    "local"|"development")
        echo "🔧 Building for local development..."
        docker-compose down --remove-orphans
        docker-compose up -d --build
        ;;
    "production"|"prod")
        echo "🏭 Building for production..."
        docker-compose -f docker-compose.prod.yml down --remove-orphans
        docker-compose -f docker-compose.prod.yml up -d --build
        ;;
    *)
        echo "❌ Unknown mode: $MODE"
        echo "Usage: ./deploy.sh [local|production]"
        exit 1
        ;;
esac

echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are healthy
echo "🔍 Checking service health..."

# Check database
if docker-compose ps postgres | grep -q "Up"; then
    echo "✅ Database is running"
else
    echo "❌ Database failed to start"
    exit 1
fi

# Check backend
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    echo "📋 Backend logs:"
    docker-compose logs --tail=10 backend
    exit 1
fi

# Check frontend
if curl -f http://localhost/health >/dev/null 2>&1 || curl -f http://localhost >/dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    echo "📋 Frontend logs:"
    docker-compose logs --tail=10 frontend
fi

# Seed database if it's a fresh deployment
echo "🌱 Checking if database needs seeding..."
if docker exec movie-explorer-backend python -c "
from app.database import SessionLocal
from app import models
db = SessionLocal()
movie_count = db.query(models.Movie).count()
print(f'Movies in database: {movie_count}')
db.close()
exit(0 if movie_count > 0 else 1)
" >/dev/null 2>&1; then
    echo "✅ Database already has data"
else
    echo "🌱 Seeding database with MovieLens data..."
    docker exec movie-explorer-backend python seed_movielens_ml100k.py
    echo "✅ Database seeded successfully"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📍 Your application is available at:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop app:     docker-compose down"
echo "   Restart:      docker-compose restart"
echo ""
echo "📚 For cloud deployment, see DEPLOYMENT.md"
