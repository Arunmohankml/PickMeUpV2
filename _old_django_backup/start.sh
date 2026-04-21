#!/bin/bash

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🔄 Collecting static files..."
python3 autoapp/manage.py collectstatic --noinput

echo "🔄 Making migrations..."
python3 autoapp/manage.py makemigrations

echo "🔄 Applying migrations..."
python3 autoapp/manage.py migrate

echo "🚀 Starting ASGI server with Uvicorn..."
cd autoapp
uvicorn autoapp.asgi:application --host 0.0.0.0 --port 8000