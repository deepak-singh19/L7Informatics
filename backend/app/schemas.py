from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class GenreOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ActorOut(BaseModel):
    id: int
    name: str
    bio: Optional[str] = None
    tmdb_person_id: Optional[int] = None
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True


class DirectorOut(BaseModel):
    id: int
    name: str
    bio: Optional[str] = None

    class Config:
        from_attributes = True


class MovieOut(BaseModel):
    id: int
    ml_id: int
    tmdb_id: Optional[int] = None
    title: str
    release_year: Optional[int] = None
    description: Optional[str] = None
    rating: Optional[float] = None
    rating_count: int = 0
    poster_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    director: Optional[DirectorOut] = None
    actors: List[ActorOut] = []
    genres: List[GenreOut] = []

    class Config:
        from_attributes = True


class ActorDetailOut(BaseModel):
    id: int
    name: str
    bio: Optional[str] = None
    tmdb_person_id: Optional[int] = None
    profile_image_url: Optional[str] = None
    movies: List[MovieOut] = []

    class Config:
        from_attributes = True


class DirectorDetailOut(BaseModel):
    id: int
    name: str
    bio: Optional[str] = None
    movies: List[MovieOut] = []

    class Config:
        from_attributes = True
