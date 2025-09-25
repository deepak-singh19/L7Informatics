from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
import os

from . import crud, models, schemas
from .database import SessionLocal, engine
from .deps import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Movie Explorer API",
    description="A FastAPI backend for exploring movies, actors, directors, and genres",
    version="1.0.0",
)

# Configure CORS for production and development
RAILWAY_STATIC_URL = os.getenv("RAILWAY_STATIC_URL", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8081", 
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "https://localhost:3000",
    "https://localhost:8080",
    "https://l7-informaticsdeepak1.vercel.app",
]

# Add Railway and production URLs
if RAILWAY_STATIC_URL:
    allowed_origins.append(f"https://{RAILWAY_STATIC_URL}")

if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

# Add common deployment domains
allowed_origins.extend([
    "https://*.vercel.app",
    "https://*.netlify.app", 
    "https://*.railway.app",
    "https://*.render.com",
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Root endpoint."""
    return {"message": "Welcome to Movie Explorer API", "docs": "/docs"}


@app.get("/health")
def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "healthy", "service": "Movie Explorer API"}


@app.get("/movies", response_model=List[schemas.MovieOut])
def get_movies(
    genre: Optional[str] = None,
    actor: Optional[str] = None,
    director: Optional[str] = None,
    release_year: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get movies with optional filtering and search."""
    logger.info(f"Getting movies with filters: genre={genre}, actor={actor}, director={director}, release_year={release_year}, search={search}")
    movies = crud.get_movies_filtered(
        db=db,
        genre=genre,
        actor=actor,
        director=director,
        release_year=release_year,
        search=search,
        skip=skip,
        limit=limit,
    )
    return movies


@app.get("/movies/{movie_id}", response_model=schemas.MovieOut)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    """Get a specific movie by ID."""
    movie = crud.get_movie_by_id(db, movie_id=movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@app.get("/actors", response_model=List[schemas.ActorOut])
def get_actors(
    movie_id: Optional[int] = None,
    genre: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get actors with optional filtering and search."""
    logger.info(f"Getting actors with filters: movie_id={movie_id}, genre={genre}, search={search}")
    if search:
        # Use simple search when search term provided
        actors = crud.get_actors(db=db, skip=skip, limit=limit, search=search)
    else:
        # Use filtered search for other parameters
        actors = crud.get_actors_filtered(
            db=db,
            movie_id=movie_id,
            genre=genre,
            skip=skip,
            limit=limit,
        )
    return actors


@app.get("/actors/{actor_id}", response_model=schemas.ActorDetailOut)
def get_actor(actor_id: int, db: Session = Depends(get_db)):
    """Get a specific actor by ID with their movies."""
    actor = crud.get_actor_by_id(db, actor_id=actor_id)
    if actor is None:
        raise HTTPException(status_code=404, detail="Actor not found")
    return actor


@app.get("/directors/{director_id}", response_model=schemas.DirectorDetailOut)
def get_director(director_id: int, db: Session = Depends(get_db)):
    """Get a specific director by ID with their movies."""
    director = crud.get_director_by_id(db, director_id=director_id)
    if director is None:
        raise HTTPException(status_code=404, detail="Director not found")
    return director


@app.get("/genres", response_model=List[schemas.GenreOut])
def get_genres(db: Session = Depends(get_db)):
    """Get all genres."""
    genres = crud.get_all_genres(db)
    return genres


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
