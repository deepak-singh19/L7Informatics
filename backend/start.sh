#!/bin/bash

# Set default port if PORT is not set
if [ -z "$PORT" ]; then
    export PORT=8000
fi

echo "Starting gunicorn on port $PORT"

# Start gunicorn
exec gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$PORT \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100
