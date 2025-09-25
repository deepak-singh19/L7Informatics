# 🎬 Movie Explorer

A full-stack movie discovery application built with FastAPI and React, featuring a comprehensive movie database with actor search and filtering capabilities.

## 🌟 Features

- **🎬 Movie Discovery**: Browse 1,600+ movies from the MovieLens dataset
- **🔍 Unified Search**: Search movies and actors in one place
- **👨‍🎭 Actor Profiles**: Detailed actor pages with filmography
- **🎭 Advanced Filtering**: Filter by genre, director, year, and more
- **📱 Responsive Design**: Works perfectly on all devices
- **🚀 Production Ready**: Deployed on Railway with PostgreSQL

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Production database
- **SQLAlchemy** - ORM for database operations
- **TMDb API** - Rich movie and actor data
- **Railway** - Cloud deployment platform

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **TanStack Query** - Data fetching and caching

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use Railway)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL="your_postgresql_url"
export TMDB_API_KEY="your_tmdb_key"
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Deployment

### Railway Backend
1. Connect GitHub repository to Railway
2. Set root directory to `backend`
3. Add environment variables:
   - `DATABASE_URL`
   - `TMDB_API_KEY`

### Vercel Frontend
1. Connect GitHub repository to Vercel
2. Set environment variable:
   - `VITE_API_BASE_URL=https://your-backend.railway.app`

## 📊 Database

The application uses a PostgreSQL database with:
- **1,682 Movies** with TMDb enrichment
- **7,397 Actors** with profile data
- **1,095 Directors**
- **18 Genres**
- **Rich relationships** between all entities

## 🔧 API Endpoints

- `GET /movies` - Get movies with filtering
- `GET /movies/{id}` - Get movie details
- `GET /actors` - Get actors with search
- `GET /actors/{id}` - Get actor details
- `GET /health` - Health check

## 📱 Features Showcase

### Movie Discovery
- Browse movies by popularity, rating, genre
- Rich movie details with cast and crew
- TMDb integration for posters and metadata

### Actor Search
- Real-time actor search with autocomplete
- Actor profile pages with filmography
- Cross-navigation between movies and actors

### Advanced Filtering
- Filter by multiple criteria simultaneously
- Text search for directors and actors
- Year-based filtering

## 🎯 Architecture

```
Frontend (React/TypeScript)
    ↓ API calls
Backend (FastAPI/Python)
    ↓ ORM queries
PostgreSQL Database
    ↓ External API
TMDb API (enrichment)
```

## 🌟 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **MovieLens** - Dataset provided by GroupLens Research
- **TMDb** - Movie and actor data
- **Railway** - Hosting and database services

---

**🎬 Built with ❤️ for movie enthusiasts**