from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from .database import Base

# Association tables for many-to-many relationships
movie_genres = Table(
    'movie_genres',
    Base.metadata,
    Column('movie_id', Integer, ForeignKey('movies.id'), primary_key=True),
    Column('genre_id', Integer, ForeignKey('genres.id'), primary_key=True)
)

movie_actors = Table(
    'movie_actors',
    Base.metadata,
    Column('movie_id', Integer, ForeignKey('movies.id'), primary_key=True),
    Column('actor_id', Integer, ForeignKey('actors.id'), primary_key=True)
)


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    ml_id = Column(Integer, unique=True, index=True)  # MovieLens movieId
    tmdb_id = Column(Integer, nullable=True)  # TMDb movie ID
    title = Column(String, index=True)
    release_year = Column(Integer, nullable=True)
    description = Column(String, nullable=True)
    rating = Column(Float, nullable=True)  # Average rating
    rating_count = Column(Integer, default=0)  # Number of ratings
    poster_url = Column(String, nullable=True)
    director_id = Column(Integer, ForeignKey("directors.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    director = relationship("Director", back_populates="movies")
    actors = relationship("Actor", secondary=movie_actors, back_populates="movies")
    genres = relationship("Genre", secondary=movie_genres, back_populates="movies")


class Actor(Base):
    __tablename__ = "actors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    bio = Column(String, nullable=True)
    tmdb_person_id = Column(Integer, nullable=True)  # TMDb person ID
    profile_image_url = Column(String, nullable=True)  # Profile image URL

    # Relationships
    movies = relationship("Movie", secondary=movie_actors, back_populates="actors")


class Director(Base):
    __tablename__ = "directors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    bio = Column(String, nullable=True)

    # Relationships
    movies = relationship("Movie", back_populates="director")


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    # Relationships
    movies = relationship("Movie", secondary=movie_genres, back_populates="genres")
