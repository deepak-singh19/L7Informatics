#!/bin/bash

# Set default port if PORT is not set
if [ -z "$PORT" ]; then
    export PORT=8000
fi

echo "Starting gunicorn on port $PORT"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "TMDB_API_KEY: ${TMDB_API_KEY:0:10}..."

# Test database connection before starting
echo "Testing database connection..."
python test_db_connection.py
if [ $? -ne 0 ]; then
    echo "❌ Database connection failed, but continuing anyway..."
fi

echo "Starting FastAPI application..."

# Start gunicorn with more verbose logging
exec gunicorn app.main:app \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$PORT \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
