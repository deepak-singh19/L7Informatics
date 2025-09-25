// Backend API Response Types
export interface GenreOut {
  id: number;
  name: string;
}

export interface ActorOut {
  id: number;
  name: string;
  bio?: string;
  tmdb_person_id?: number;
  profile_image_url?: string;
}

export interface DirectorOut {
  id: number;
  name: string;
  bio?: string;
}

export interface MovieOut {
  id: number;
  ml_id: number;
  tmdb_id?: number;
  title: string;
  release_year?: number;
  description?: string;
  rating?: number;
  rating_count: number;
  poster_url?: string;
  created_at: string;
  updated_at: string;
  director?: DirectorOut;
  actors: ActorOut[];
  genres: GenreOut[];
}

export interface ActorDetailOut {
  id: number;
  name: string;
  bio?: string;
  tmdb_person_id?: number;
  profile_image_url?: string;
  movies: MovieOut[];
}

export interface DirectorDetailOut {
  id: number;
  name: string;
  bio?: string;
  movies: MovieOut[];
}
