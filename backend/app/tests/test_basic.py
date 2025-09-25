import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app import crud, models


def test_get_movies_empty(client: TestClient):
    """Test that GET /movies returns empty list before seeding."""
    response = client.get("/movies")
    assert response.status_code == 200
    assert response.json() == []


def test_get_genres_empty(client: TestClient):
    """Test that GET /genres returns empty list before seeding."""
    response = client.get("/genres")
    assert response.status_code == 200
    assert response.json() == []


def test_seed_and_query_movies(client: TestClient, db_session: Session):
    """Test seeding movies and querying them."""
    # Create test data
    # Create genres
    action_genre = crud.get_or_create_genre(db_session, "Action")
    comedy_genre = crud.get_or_create_genre(db_session, "Comedy")
    
    # Create directors
    director1 = crud.get_or_create_director(db_session, "John Director", "Famous director")
    director2 = crud.get_or_create_director(db_session, "Jane Director", "Another famous director")
    
    # Create actors
    actor1 = crud.get_or_create_actor(db_session, "Tom Actor", "Famous actor")
    actor2 = crud.get_or_create_actor(db_session, "Jane Actor", "Famous actress")
    actor3 = crud.get_or_create_actor(db_session, "Bob Actor", "Character actor")
    
    # Create movies
    movie1 = crud.create_or_update_movie_by_ml_id(
        db=db_session,
        ml_id=1,
        title="Test Movie 1",
        release_year=1995,
        description="A test action movie",
        rating=4.5,
        rating_count=100,
        director=director1,
        actors=[actor1, actor2],
        genres=[action_genre],
    )
    
    movie2 = crud.create_or_update_movie_by_ml_id(
        db=db_session,
        ml_id=2,
        title="Test Movie 2",
        release_year=2000,
        description="A test comedy movie",
        rating=3.8,
        rating_count=50,
        director=director2,
        actors=[actor2, actor3],
        genres=[comedy_genre],
    )
    
    # Test GET /movies
    response = client.get("/movies")
    assert response.status_code == 200
    movies = response.json()
    assert len(movies) == 2
    
    # Verify movie data
    movie_titles = [m["title"] for m in movies]
    assert "Test Movie 1" in movie_titles
    assert "Test Movie 2" in movie_titles
    
    # Test filtering by genre
    response = client.get("/movies?genre=Action")
    assert response.status_code == 200
    action_movies = response.json()
    assert len(action_movies) == 1
    assert action_movies[0]["title"] == "Test Movie 1"
    
    # Test filtering by actor
    response = client.get("/movies?actor=Jane Actor")
    assert response.status_code == 200
    jane_movies = response.json()
    assert len(jane_movies) == 2  # Jane Actor is in both movies
    
    # Test filtering by director
    response = client.get("/movies?director=John Director")
    assert response.status_code == 200
    john_movies = response.json()
    assert len(john_movies) == 1
    assert john_movies[0]["title"] == "Test Movie 1"
    
    # Test filtering by release year
    response = client.get("/movies?release_year=1995")
    assert response.status_code == 200
    movies_1995 = response.json()
    assert len(movies_1995) == 1
    assert movies_1995[0]["title"] == "Test Movie 1"


def test_get_actors_filtered(client: TestClient, db_session: Session):
    """Test GET /actors with filtering."""
    # Create test data
    action_genre = crud.get_or_create_genre(db_session, "Action")
    drama_genre = crud.get_or_create_genre(db_session, "Drama")
    
    director = crud.get_or_create_director(db_session, "Test Director")
    
    actor1 = crud.get_or_create_actor(db_session, "Action Actor")
    actor2 = crud.get_or_create_actor(db_session, "Drama Actor")
    
    # Create movies with different actors and genres
    movie1 = crud.create_or_update_movie_by_ml_id(
        db=db_session,
        ml_id=1,
        title="Action Movie",
        director=director,
        actors=[actor1],
        genres=[action_genre],
    )
    
    movie2 = crud.create_or_update_movie_by_ml_id(
        db=db_session,
        ml_id=2,
        title="Drama Movie",
        director=director,
        actors=[actor2],
        genres=[drama_genre],
    )
    
    # Test GET /actors with genre filter
    response = client.get("/actors?genre=Action")
    assert response.status_code == 200
    action_actors = response.json()
    assert len(action_actors) == 1
    assert action_actors[0]["name"] == "Action Actor"
    
    # Test GET /actors with movie_id filter
    response = client.get(f"/actors?movie_id={movie1.id}")
    assert response.status_code == 200
    movie_actors = response.json()
    assert len(movie_actors) == 1
    assert movie_actors[0]["name"] == "Action Actor"


def test_get_movie_by_id(client: TestClient, db_session: Session):
    """Test GET /movies/{id}."""
    # Create test data
    genre = crud.get_or_create_genre(db_session, "Test Genre")
    director = crud.get_or_create_director(db_session, "Test Director")
    actor = crud.get_or_create_actor(db_session, "Test Actor")
    
    movie = crud.create_or_update_movie_by_ml_id(
        db=db_session,
        ml_id=1,
        title="Test Movie",
        release_year=2000,
        description="A test movie",
        rating=4.0,
        rating_count=10,
        director=director,
        actors=[actor],
        genres=[genre],
    )
    
    # Test successful retrieval
    response = client.get(f"/movies/{movie.id}")
    assert response.status_code == 200
    movie_data = response.json()
    assert movie_data["title"] == "Test Movie"
    assert movie_data["release_year"] == 2000
    assert movie_data["director"]["name"] == "Test Director"
    assert len(movie_data["actors"]) == 1
    assert movie_data["actors"][0]["name"] == "Test Actor"
    assert len(movie_data["genres"]) == 1
    assert movie_data["genres"][0]["name"] == "Test Genre"
    
    # Test 404 for non-existent movie
    response = client.get("/movies/99999")
    assert response.status_code == 404


def test_get_actor_by_id(client: TestClient, db_session: Session):
    """Test GET /actors/{id}."""
    # Create test data
    genre = crud.get_or_create_genre(db_session, "Test Genre")
    director = crud.get_or_create_director(db_session, "Test Director")
    actor = crud.get_or_create_actor(db_session, "Test Actor", "Actor bio")
    
    movie = crud.create_or_update_movie_by_ml_id(
        db=db_session,
        ml_id=1,
        title="Test Movie",
        director=director,
        actors=[actor],
        genres=[genre],
    )
    
    # Test successful retrieval
    response = client.get(f"/actors/{actor.id}")
    assert response.status_code == 200
    actor_data = response.json()
    assert actor_data["name"] == "Test Actor"
    assert actor_data["bio"] == "Actor bio"
    assert len(actor_data["movies"]) == 1
    assert actor_data["movies"][0]["title"] == "Test Movie"
    
    # Test 404 for non-existent actor
    response = client.get("/actors/99999")
    assert response.status_code == 404


def test_get_director_by_id(client: TestClient, db_session: Session):
    """Test GET /directors/{id}."""
    # Create test data
    director = crud.get_or_create_director(db_session, "Test Director", "Director bio")
    
    movie = crud.create_or_update_movie_by_ml_id(
        db=db_session,
        ml_id=1,
        title="Test Movie",
        director=director,
        actors=[],
        genres=[],
    )
    
    # Test successful retrieval
    response = client.get(f"/directors/{director.id}")
    assert response.status_code == 200
    director_data = response.json()
    assert director_data["name"] == "Test Director"
    assert director_data["bio"] == "Director bio"
    assert len(director_data["movies"]) == 1
    assert director_data["movies"][0]["title"] == "Test Movie"
    
    # Test 404 for non-existent director
    response = client.get("/directors/99999")
    assert response.status_code == 404
