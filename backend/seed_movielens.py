#!/usr/bin/env python3
"""
MovieLens seeder script with optional TMDb enrichment.
Reads MovieLens CSV files and populates the database with movies, ratings, actors, directors, and genres.
"""

import csv
import os
import re
import time
import logging
from collections import defaultdict
from typing import Dict, List, Optional, Tuple
import requests
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Import from the app
from app.database import SessionLocal, engine
from app import models, crud

# Load environment variables
load_dotenv()

# Configuration
ML_DATA_DIR = os.getenv("ML_DATA_DIR", "backend/data")
ML_MOVIES = os.getenv("ML_MOVIES", "movies.csv")
ML_RATINGS = os.getenv("ML_RATINGS", "ratings.csv")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_SLEEP = float(os.getenv("TMDB_SLEEP", "0.25"))  # Sleep between API calls

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_year_from_title(title: str) -> Tuple[str, Optional[int]]:
    """Extract year from MovieLens title format 'Movie Title (YYYY)'."""
    match = re.search(r'^(.+?)\s*\((\d{4})\)$', title.strip())
    if match:
        clean_title = match.group(1).strip()
        year = int(match.group(2))
        return clean_title, year
    return title.strip(), None


def parse_genres(genre_string: str) -> List[str]:
    """Parse MovieLens genre string into list."""
    if not genre_string or genre_string == "(no genres listed)":
        return []
    return [g.strip() for g in genre_string.split("|") if g.strip()]


def calculate_ratings(ratings_file: str) -> Dict[int, Tuple[float, int]]:
    """Calculate average ratings and counts from ratings.csv."""
    logger.info(f"Calculating ratings from {ratings_file}")
    ratings_data = defaultdict(list)
    
    try:
        with open(ratings_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                movie_id = int(row['movieId'])
                rating = float(row['rating'])
                ratings_data[movie_id].append(rating)
    except FileNotFoundError:
        logger.warning(f"Ratings file {ratings_file} not found. Proceeding without ratings.")
        return {}
    
    # Calculate averages
    movie_ratings = {}
    for movie_id, ratings in ratings_data.items():
        avg_rating = sum(ratings) / len(ratings)
        movie_ratings[movie_id] = (round(avg_rating, 2), len(ratings))
    
    logger.info(f"Calculated ratings for {len(movie_ratings)} movies")
    return movie_ratings


class TMDbEnricher:
    """Handle TMDb API calls for movie enrichment."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.params = {'api_key': api_key}
    
    def search_movie(self, title: str, year: Optional[int] = None) -> Optional[Dict]:
        """Search for a movie on TMDb."""
        params = {'query': title}
        if year:
            params['year'] = year
        
        try:
            response = self.session.get(f"{TMDB_BASE_URL}/search/movie", params=params)
            response.raise_for_status()
            data = response.json()
            
            if data['results']:
                return data['results'][0]  # Return first result
        except requests.RequestException as e:
            logger.warning(f"TMDb search failed for '{title}' ({year}): {e}")
        
        return None
    
    def get_movie_details(self, tmdb_id: int) -> Optional[Dict]:
        """Get detailed movie information from TMDb."""
        try:
            response = self.session.get(f"{TMDB_BASE_URL}/movie/{tmdb_id}")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.warning(f"TMDb details failed for ID {tmdb_id}: {e}")
        
        return None
    
    def get_movie_credits(self, tmdb_id: int) -> Optional[Dict]:
        """Get movie credits (cast and crew) from TMDb."""
        try:
            response = self.session.get(f"{TMDB_BASE_URL}/movie/{tmdb_id}/credits")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.warning(f"TMDb credits failed for ID {tmdb_id}: {e}")
        
        return None


def deterministic_placeholder_director(movie_ml_id: int) -> str:
    """Generate a deterministic placeholder director name."""
    # Use a simple hash-like function for deterministic results
    hash_val = (movie_ml_id * 17 + 42) % 1000
    return f"Director_{hash_val:03d}"


def deterministic_placeholder_actors(movie_ml_id: int, top_n: int = 5) -> List[str]:
    """Generate deterministic placeholder actor names."""
    actors = []
    base_hash = movie_ml_id * 23
    for i in range(top_n):
        hash_val = (base_hash + i * 13) % 1000
        actors.append(f"Actor_{hash_val:03d}")
    return actors


def enrich_movie_with_tmdb(
    enricher: TMDbEnricher, 
    title: str, 
    year: Optional[int],
    db: Session
) -> Tuple[Optional[int], Optional[str], Optional[models.Director], List[models.Actor]]:
    """Enrich movie data using TMDb API."""
    # Search for the movie
    movie_data = enricher.search_movie(title, year)
    if not movie_data:
        return None, None, None, []
    
    tmdb_id = movie_data['id']
    poster_path = movie_data.get('poster_path')
    poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else None
    
    # Get credits
    credits = enricher.get_movie_credits(tmdb_id)
    director = None
    actors = []
    
    if credits:
        # Find director
        crew = credits.get('crew', [])
        directors = [c for c in crew if c.get('job') == 'Director']
        if directors:
            director_name = directors[0]['name']
            director = crud.get_or_create_director(db, director_name)
        
        # Get top actors
        cast = credits.get('cast', [])
        top_actors = cast[:8]  # Top 8 actors
        for actor_data in top_actors:
            actor_name = actor_data['name']
            actor = crud.get_or_create_actor(db, actor_name)
            actors.append(actor)
    
    time.sleep(TMDB_SLEEP)  # Rate limiting
    return tmdb_id, poster_url, director, actors


def create_placeholder_data(movie_ml_id: int, db: Session) -> Tuple[models.Director, List[models.Actor]]:
    """Create deterministic placeholder director and actors."""
    director_name = deterministic_placeholder_director(movie_ml_id)
    director = crud.get_or_create_director(db, director_name, bio="Placeholder director")
    
    actor_names = deterministic_placeholder_actors(movie_ml_id)
    actors = []
    for actor_name in actor_names:
        actor = crud.get_or_create_actor(db, actor_name, bio="Placeholder actor")
        actors.append(actor)
    
    return director, actors


def seed_movies(movies_file: str, movie_ratings: Dict[int, Tuple[float, int]]):
    """Seed movies from MovieLens CSV file."""
    logger.info(f"Seeding movies from {movies_file}")
    
    # Initialize TMDb enricher if API key is available
    enricher = TMDbEnricher(TMDB_API_KEY) if TMDB_API_KEY else None
    if enricher:
        logger.info("TMDb enrichment enabled")
    else:
        logger.info("TMDb enrichment disabled - using placeholder data")
    
    # Create database session
    db = SessionLocal()
    
    try:
        with open(movies_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            processed = 0
            
            for row in reader:
                movie_id = int(row['movieId'])
                title_with_year = row['title']
                genre_string = row['genres']
                
                # Extract title and year
                title, year = extract_year_from_title(title_with_year)
                
                # Get rating data
                rating, rating_count = movie_ratings.get(movie_id, (None, 0))
                
                # Parse genres
                genre_names = parse_genres(genre_string)
                genres = [crud.get_or_create_genre(db, name) for name in genre_names]
                
                # Enrich with TMDb or create placeholders
                tmdb_id = None
                poster_url = None
                director = None
                actors = []
                
                if enricher:
                    try:
                        tmdb_id, poster_url, director, actors = enrich_movie_with_tmdb(
                            enricher, title, year, db
                        )
                    except Exception as e:
                        logger.warning(f"TMDb enrichment failed for '{title}': {e}")
                
                # Create placeholder data if TMDb enrichment failed or is disabled
                if director is None:
                    director, placeholder_actors = create_placeholder_data(movie_id, db)
                    if not actors:  # Only use placeholders if no TMDb actors
                        actors = placeholder_actors
                
                # Create or update movie
                movie = crud.create_or_update_movie_by_ml_id(
                    db=db,
                    ml_id=movie_id,
                    title=title,
                    release_year=year,
                    description=f"A {year} film" if year else "A classic film",
                    rating=rating,
                    rating_count=rating_count,
                    poster_url=poster_url,
                    tmdb_id=tmdb_id,
                    director=director,
                    actors=actors,
                    genres=genres,
                )
                
                processed += 1
                if processed % 50 == 0:
                    logger.info(f"Processed {processed} movies...")
        
        logger.info(f"Successfully seeded {processed} movies")
    
    except FileNotFoundError:
        logger.error(f"Movies file {movies_file} not found")
        raise
    except Exception as e:
        logger.error(f"Error seeding movies: {e}")
        raise
    finally:
        db.close()


def main():
    """Main seeding function."""
    logger.info("Starting MovieLens seeding process")
    
    # Ensure database tables exist
    models.Base.metadata.create_all(bind=engine)
    
    # File paths
    movies_file = os.path.join(ML_DATA_DIR, ML_MOVIES)
    ratings_file = os.path.join(ML_DATA_DIR, ML_RATINGS)
    
    # Calculate ratings
    movie_ratings = calculate_ratings(ratings_file)
    
    # Seed movies
    seed_movies(movies_file, movie_ratings)
    
    logger.info("MovieLens seeding completed successfully!")


if __name__ == "__main__":
    main()
