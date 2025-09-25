import { MovieOut, GenreOut, ActorOut, ActorDetailOut, DirectorOut } from '../types/movie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Generic API call function
async function apiCall<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Movie API calls
export const movieApi = {
  // Get movies with optional filters
  getMovies: async (params: {
    genre?: string;
    actor?: string;
    director?: string;
    release_year?: number;
    search?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<MovieOut[]> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/movies${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<MovieOut[]>(endpoint);
  },

  // Get movie by ID
  getMovie: async (id: number): Promise<MovieOut> => {
    return apiCall<MovieOut>(`/movies/${id}`);
  },

  // Get movies by genre
  getMoviesByGenre: async (genre: string, limit: number = 20): Promise<MovieOut[]> => {
    return movieApi.getMovies({ genre, limit });
  },

  // Get movies by actor
  getMoviesByActor: async (actor: string, limit: number = 20): Promise<MovieOut[]> => {
    return movieApi.getMovies({ actor, limit });
  },

  // Get movies by director
  getMoviesByDirector: async (director: string, limit: number = 20): Promise<MovieOut[]> => {
    return movieApi.getMovies({ director, limit });
  },

  // Get movies by year
  getMoviesByYear: async (year: number, limit: number = 20): Promise<MovieOut[]> => {
    return movieApi.getMovies({ release_year: year, limit });
  },

  // Search movies (using backend search)
  searchMovies: async (query: string): Promise<MovieOut[]> => {
    return movieApi.getMovies({ search: query, limit: 100 });
  }
};

// Genre API calls
export const genreApi = {
  getGenres: async (): Promise<GenreOut[]> => {
    return apiCall<GenreOut[]>('/genres');
  }
};

// Actor API calls
export const actorApi = {
  getActors: async (params: {
    movie_id?: number;
    genre?: string;
    search?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<ActorOut[]> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/actors${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<ActorOut[]>(endpoint);
  },

  getActor: async (id: number): Promise<ActorDetailOut> => {
    return apiCall<ActorDetailOut>(`/actors/${id}`);
  },

  searchActors: async (query: string): Promise<ActorOut[]> => {
    return actorApi.getActors({ search: query, limit: 50 });
  },

  getActorMovies: async (id: number): Promise<MovieOut[]> => {
    return apiCall<MovieOut[]>(`/actors/${id}/movies`);
  }
};

// Director API calls
export const directorApi = {
  getDirector: async (id: number) => {
    return apiCall(`/directors/${id}`);
  }
};
