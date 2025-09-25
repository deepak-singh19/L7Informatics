# Movie Explorer Backend

FastAPI backend application for the Movie Explorer project.

## Architecture

This backend is built with:
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **Pydantic**: Data validation using Python type annotations
- **PostgreSQL/SQLite**: Database backends
- **TMDb API**: Optional movie metadata enrichment

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application and routes
│   ├── database.py      # Database configuration
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas
│   ├── crud.py          # Database operations
│   ├── deps.py          # Dependency injection
│   └── tests/           # Test suite
├── seed_movielens.py    # MovieLens data seeder
├── requirements.txt     # Production dependencies
├── requirements-dev.txt # Development dependencies
├── Dockerfile           # Container definition
└── README_BACKEND.md    # This file
```

## Database Models

### Core Models

#### Movie
```python
class Movie(Base):
    id: int                    # Primary key
    ml_id: int                 # MovieLens movie ID (unique)
    tmdb_id: Optional[int]     # TMDb movie ID
    title: str                 # Movie title
    release_year: Optional[int] # Year of release
    description: Optional[str] # Movie description
    rating: Optional[float]    # Average rating
    rating_count: int          # Number of ratings
    poster_url: Optional[str]  # Poster image URL
    director_id: Optional[int] # Foreign key to director
    created_at: datetime       # Creation timestamp
    updated_at: datetime       # Last update timestamp
```

#### Actor
```python
class Actor(Base):
    id: int              # Primary key
    name: str            # Actor name
    bio: Optional[str]   # Actor biography
```

#### Director
```python
class Director(Base):
    id: int              # Primary key
    name: str            # Director name
    bio: Optional[str]   # Director biography
```

#### Genre
```python
class Genre(Base):
    id: int    # Primary key
    name: str  # Genre name (unique)
```

### Relationships

- **Movie ↔ Actor**: Many-to-many via `movie_actors` table
- **Movie → Director**: Many-to-one relationship
- **Movie ↔ Genre**: Many-to-many via `movie_genres` table

## API Endpoints

### Movies
- `GET /movies` - List movies with filtering
  - **Query Parameters**:
    - `genre`: Filter by genre name (partial match)
    - `actor`: Filter by actor name (partial match)
    - `director`: Filter by director name (partial match)
    - `release_year`: Filter by exact release year
    - `skip`: Pagination offset (default: 0)
    - `limit`: Page size (default: 100)
  - **Response**: List of `MovieOut` objects

- `GET /movies/{id}` - Get movie by ID
  - **Response**: `MovieOut` object
  - **Status**: 404 if not found

### Actors
- `GET /actors` - List actors with filtering
  - **Query Parameters**:
    - `movie_id`: Filter actors by movie ID
    - `genre`: Filter actors by genre name
    - `skip`: Pagination offset (default: 0)
    - `limit`: Page size (default: 100)
  - **Response**: List of `ActorOut` objects

- `GET /actors/{id}` - Get actor profile
  - **Response**: `ActorDetailOut` object with movies
  - **Status**: 404 if not found

### Directors
- `GET /directors/{id}` - Get director profile
  - **Response**: `DirectorDetailOut` object with movies
  - **Status**: 404 if not found

### Genres
- `GET /genres` - List all genres
  - **Response**: List of `GenreOut` objects

### Documentation
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc documentation

## Database Operations (CRUD)

### Key Functions

#### Genre Operations
```python
get_or_create_genre(db: Session, name: str) -> Genre
```

#### Actor Operations
```python
get_or_create_actor(db: Session, name: str, bio: Optional[str] = None) -> Actor
get_actors_filtered(db: Session, movie_id: Optional[int] = None, genre: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Actor]
get_actor_by_id(db: Session, actor_id: int) -> Optional[Actor]
```

#### Director Operations
```python
get_or_create_director(db: Session, name: str, bio: Optional[str] = None) -> Director
get_director_by_id(db: Session, director_id: int) -> Optional[Director]
```

#### Movie Operations
```python
create_or_update_movie_by_ml_id(db: Session, ml_id: int, ...) -> Movie
get_movies_filtered(db: Session, genre: Optional[str] = None, actor: Optional[str] = None, director: Optional[str] = None, release_year: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Movie]
get_movie_by_id(db: Session, movie_id: int) -> Optional[Movie]
```

### Filtering Implementation

All filtering is implemented at the database level using SQLAlchemy joins:

```python
# Example: Filter movies by actor name
query = db.query(Movie).join(Movie.actors).filter(
    Actor.name.ilike(f"%{actor}%")
).distinct()
```

## MovieLens Seeder

The `seed_movielens.py` script imports data from MovieLens CSV files.

### Features
- **Idempotent**: Safe to run multiple times (upserts by `ml_id`)
- **TMDb Integration**: Optional enrichment with real metadata
- **Rate Limiting**: Respects TMDb API limits
- **Deterministic Fallback**: Generates consistent placeholder data
- **Progress Logging**: Shows import progress

### Usage

```bash
# Local execution
export TMDB_API_KEY=your_key  # Optional
python seed_movielens.py

# Docker execution
docker-compose run --rm -e TMDB_API_KEY=your_key backend python seed_movielens.py
```

### TMDb Enrichment Process

When `TMDB_API_KEY` is provided:

1. **Search**: Search TMDb by movie title and year
2. **Details**: Fetch movie details for poster URL
3. **Credits**: Get cast and crew information
4. **Extract**: Get director (job="Director") and top 8 cast members
5. **Store**: Create/update Actor and Director records

### Placeholder Data Generation

Without TMDb enrichment:
- **Director**: `Director_{hash:03d}` (deterministic based on movie ID)
- **Actors**: `Actor_{hash:03d}` (5 actors per movie)
- **Bio**: Generic placeholder text

### Configuration

Environment variables:
- `ML_DATA_DIR`: Data directory path (default: `backend/data`)
- `ML_MOVIES`: Movies CSV filename (default: `movies.csv`)
- `ML_RATINGS`: Ratings CSV filename (default: `ratings.csv`)
- `TMDB_API_KEY`: TMDb API key (optional)
- `TMDB_SLEEP`: Sleep between API calls (default: 0.25s)

## Database Configuration

### SQLite (Default)
```python
DATABASE_URL = "sqlite:///./dev.db"
```

### PostgreSQL
```python
DATABASE_URL = "postgresql://user:password@host:port/database"
```

### Connection Handling
- **SQLite**: Includes `check_same_thread=False` for FastAPI compatibility
- **PostgreSQL**: Standard connection pool
- **Session Management**: Dependency injection with proper cleanup

## Testing

### Test Structure
```
tests/
├── conftest.py      # Test configuration and fixtures
└── test_basic.py    # Core API and functionality tests
```

### Test Database
- **In-memory SQLite**: Fresh database for each test
- **Dependency Override**: Replaces production database with test database
- **Fixtures**: Database session and test client fixtures

### Test Coverage
- API endpoint functionality
- Database operations (CRUD)
- Filtering logic
- Data model relationships
- Error handling (404s)

### Running Tests
```bash
# Local
cd backend && pytest -v

# Docker
docker-compose run --rm backend pytest -v

# With coverage
cd backend && pytest --cov=app tests/
```

## Development

### Local Setup
```bash
# Install dependencies
pip install -r requirements.txt -r requirements-dev.txt

# Run with auto-reload
uvicorn app.main:app --reload --port 8000

# Run linting
ruff check .

# Run tests
pytest -v
```

### Code Quality
- **Linting**: ruff for code style and error checking
- **Type Hints**: Comprehensive type annotations
- **Documentation**: Docstrings for all public functions
- **Error Handling**: Proper HTTP status codes and error messages

### Database Migrations
For production deployments with schema changes:
1. Use Alembic for migrations
2. Version control schema changes
3. Test migrations on staging data

## Performance Considerations

### Query Optimization
- **Joins**: Efficient filtering using database joins
- **Distinct**: Prevents duplicates from many-to-many relationships
- **Indexing**: Indexes on frequently filtered columns
- **Pagination**: Limit/offset for large result sets

### Caching
Consider adding caching for:
- Genre lists (rarely change)
- Popular movies
- Search results

### Database Connection Pooling
For high-traffic deployments:
- Configure SQLAlchemy connection pool
- Monitor connection usage
- Consider read replicas

## Security

### Current Implementation
- **CORS**: Configured for development (allow all origins)
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection**: SQLAlchemy ORM prevents SQL injection

### Production Considerations
- Restrict CORS origins
- Add authentication/authorization
- Rate limiting
- Input sanitization
- HTTPS enforcement

## Monitoring and Logging

### Current Logging
- **Application**: INFO level logging for key operations
- **Request Tracking**: Log filtering parameters
- **Error Handling**: Exception logging with context

### Production Monitoring
Consider adding:
- Health check endpoints
- Metrics collection (Prometheus)
- Distributed tracing
- Error tracking (Sentry)

## Deployment

### Docker Deployment
```bash
# Build
docker-compose build

# Deploy
docker-compose up -d

# Seed
docker-compose run --rm backend python seed_movielens.py
```

### Environment Variables
Ensure these are set in production:
- `DATABASE_URL`: Production database connection
- `TMDB_API_KEY`: For metadata enrichment
- Additional security and performance settings

### Health Checks
The application includes basic health endpoints and database connectivity checks.
