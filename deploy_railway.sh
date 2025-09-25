#!/bin/bash

# Railway Deployment Script for Movie Explorer Backend
set -e

echo "🚂 Railway Deployment Setup for Movie Explorer"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "backend/app/main.py" ]; then
    echo "❌ Please run this script from the movie-explorer root directory"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for Railway deployment"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 Committing latest changes..."
    git add .
    git commit -m "Prepare for Railway deployment"
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo ""
echo "🚂 Railway deployment options:"
echo "1. Deploy via GitHub (Recommended)"
echo "2. Deploy via Railway CLI"
echo ""
read -p "Choose option (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "📋 GitHub Deployment Steps:"
        echo ""
        echo "1. Push your code to GitHub:"
        echo "   git remote add origin https://github.com/yourusername/movie-explorer.git"
        echo "   git push -u origin main"
        echo ""
        echo "2. Go to https://railway.app"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Select your movie-explorer repository"
        echo "5. Set root directory to 'backend'"
        echo ""
        echo "6. Add PostgreSQL:"
        echo "   - Click '+ New' → 'Database' → 'PostgreSQL'"
        echo ""
        echo "7. Set environment variables in your backend service:"
        echo "   DATABASE_URL=<copy from PostgreSQL service>"
        echo "   TMDB_API_KEY=57d74fbc7e37c7dd45bc8dd8b3961bab"
        echo ""
        echo "8. Deploy and test:"
        echo "   https://your-backend.railway.app/health"
        echo "   https://your-backend.railway.app/docs"
        echo ""
        ;;
    2)
        echo ""
        echo "🚀 CLI Deployment:"
        echo ""
        
        # Login to Railway
        echo "🔐 Logging into Railway..."
        railway login
        
        # Create new project
        echo "📝 Creating new Railway project..."
        railway init
        
        # Add PostgreSQL
        echo "🗄️ Adding PostgreSQL database..."
        railway add postgresql
        
        # Set environment variables
        echo "🔧 Setting environment variables..."
        railway variables set TMDB_API_KEY=57d74fbc7e37c7dd45bc8dd8b3961bab
        
        # Deploy
        echo "🚀 Deploying to Railway..."
        cd backend
        railway up
        
        echo "✅ Deployment initiated!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Check Railway dashboard for deployment status"
        echo "2. Note your backend URL from Railway dashboard"
        echo "3. Test your API endpoints"
        echo ""
        ;;
    *)
        echo "❌ Invalid option selected"
        exit 1
        ;;
esac

echo ""
echo "📚 For detailed instructions, see RAILWAY_DEPLOYMENT.md"
echo ""
echo "🔧 Important Environment Variables for Railway:"
echo "   DATABASE_URL=<PostgreSQL connection string>"
echo "   TMDB_API_KEY=57d74fbc7e37c7dd45bc8dd8b3961bab"
echo "   FRONTEND_URL=https://your-frontend-domain.com (optional)"
echo ""
echo "🧪 Test endpoints after deployment:"
echo "   GET /health - Health check"
echo "   GET /movies - Movie list"
echo "   GET /docs - API documentation"
echo ""
echo "🎉 Your Movie Explorer backend is ready for Railway!"
