from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, distinct
from . import models


def get_or_create_genre(db: Session, name: str) -> models.Genre:
    """Get or create a genre by name."""
    genre = db.query(models.Genre).filter(models.Genre.name == name).first()
    if not genre:
        genre = models.Genre(name=name)
        db.add(genre)
        db.commit()
        db.refresh(genre)
    return genre


def get_or_create_director(db: Session, name: str, bio: Optional[str] = None) -> models.Director:
    """Get or create a director by name."""
    director = db.query(models.Director).filter(models.Director.name == name).first()
    if not director:
        director = models.Director(name=name, bio=bio)
        db.add(director)
        db.commit()
        db.refresh(director)
    return director


def get_or_create_actor(db: Session, name: str, bio: Optional[str] = None) -> models.Actor:
    """Get or create an actor by name."""
    actor = db.query(models.Actor).filter(models.Actor.name == name).first()
    if not actor:
        actor = models.Actor(name=name, bio=bio)
        db.add(actor)
        db.commit()
        db.refresh(actor)
    return actor


def create_or_update_movie_by_ml_id(
    db: Session,
    ml_id: int,
    title: str,
    release_year: Optional[int] = None,
    description: Optional[str] = None,
    rating: Optional[float] = None,
    rating_count: int = 0,
    poster_url: Optional[str] = None,
    tmdb_id: Optional[int] = None,
    director: Optional[models.Director] = None,
    actors: Optional[List[models.Actor]] = None,
    genres: Optional[List[models.Genre]] = None,
) -> models.Movie:
    """Create or update a movie by MovieLens ID."""
    movie = db.query(models.Movie).filter(models.Movie.ml_id == ml_id).first()
    
    if movie:
        # Update existing movie
        movie.title = title
        movie.release_year = release_year
        movie.description = description
        movie.rating = rating
        movie.rating_count = rating_count
        movie.poster_url = poster_url
        movie.tmdb_id = tmdb_id
        if director:
            movie.director = director
    else:
        # Create new movie
        movie = models.Movie(
            ml_id=ml_id,
            title=title,
            release_year=release_year,
            description=description,
            rating=rating,
            rating_count=rating_count,
            poster_url=poster_url,
            tmdb_id=tmdb_id,
            director=director,
        )
        db.add(movie)
    
    # Update relationships
    if actors is not None:
        movie.actors = actors
    if genres is not None:
        movie.genres = genres
    
    db.commit()
    db.refresh(movie)
    return movie


def get_movies_filtered(
    db: Session,
    genre: Optional[str] = None,
    actor: Optional[str] = None,
    director: Optional[str] = None,
    release_year: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[models.Movie]:
    """Get movies with optional filtering."""
    query = db.query(models.Movie)
    
    # Join tables for filtering
    if genre:
        query = query.join(models.Movie.genres).filter(
            models.Genre.name.ilike(f"%{genre}%")
        )
    
    if actor:
        query = query.join(models.Movie.actors).filter(
            models.Actor.name.ilike(f"%{actor}%")
        )
    
    if director:
        query = query.join(models.Movie.director).filter(
            models.Director.name.ilike(f"%{director}%")
        )
    
    if release_year:
        query = query.filter(models.Movie.release_year == release_year)
    
    if search:
        query = query.filter(models.Movie.title.ilike(f"%{search}%"))
    
    # Use distinct to prevent duplicates from joins
    query = query.distinct()
    
    return query.offset(skip).limit(limit).all()


def get_actors_filtered(
    db: Session,
    movie_id: Optional[int] = None,
    genre: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[models.Actor]:
    """Get actors with optional filtering."""
    query = db.query(models.Actor)
    
    if movie_id:
        query = query.join(models.Actor.movies).filter(
            models.Movie.id == movie_id
        )
    
    if genre:
        query = query.join(models.Actor.movies).join(models.Movie.genres).filter(
            models.Genre.name.ilike(f"%{genre}%")
        )
    
    # Use distinct to prevent duplicates from joins
    query = query.distinct()
    
    return query.offset(skip).limit(limit).all()


def get_movie_by_id(db: Session, movie_id: int) -> Optional[models.Movie]:
    """Get a movie by ID."""
    return db.query(models.Movie).filter(models.Movie.id == movie_id).first()


def get_actor_by_id(db: Session, actor_id: int) -> Optional[models.Actor]:
    """Get an actor by ID."""
    return db.query(models.Actor).filter(models.Actor.id == actor_id).first()


def get_director_by_id(db: Session, director_id: int) -> Optional[models.Director]:
    """Get a director by ID."""
    return db.query(models.Director).filter(models.Director.id == director_id).first()


def get_all_genres(db: Session) -> List[models.Genre]:
    """Get all genres."""
    return db.query(models.Genre).all()


def get_actors(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    """Get all actors with optional search."""
    query = db.query(models.Actor)
    if search:
        query = query.filter(models.Actor.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


def get_actor_movies(db: Session, actor_id: int):
    """Get all movies for a specific actor."""
    actor = db.query(models.Actor).filter(models.Actor.id == actor_id).first()
    if actor:
        return actor.movies
    return []


def get_all_directors(db: Session) -> List[models.Director]:
    """Get all directors."""
    return db.query(models.Director).all()
