import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/HeroSection";
import { MovieRow } from "@/components/MovieRow";
import { MovieFilter } from "@/components/movieFilter";
import { MovieDetailsModal } from "@/components/MovieDetailsModal";
import { ActorCard } from "@/components/ActorCard";
import { movieApi, genreApi, actorApi } from "@/services/api";
import { MovieOut, ActorOut } from "@/types/movie";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [filteredMovies, setFilteredMovies] = useState<MovieOut[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all movies for filtering
  const { data: allMovies = [], isLoading: loadingAllMovies } = useQuery({
    queryKey: ['movies', 'all'],
    queryFn: () => movieApi.getMovies({ limit: 1000 }) // Get more movies for filtering
  });

  // Fetch popular movies (highest rated with most ratings)
  const { data: popularMovies = [], isLoading: loadingPopular } = useQuery({
    queryKey: ['movies', 'popular'],
    queryFn: () => movieApi.getMovies({ limit: 20 }),
    select: (data) => data
      .filter(movie => movie.rating && movie.rating_count > 50)
      .sort((a, b) => (b.rating || 0) * (b.rating_count || 0) - (a.rating || 0) * (a.rating_count || 0))
      .slice(0, 15)
  });

  // Fetch top rated movies (rating > 4.0)
  const { data: topRatedMovies = [], isLoading: loadingTopRated } = useQuery({
    queryKey: ['movies', 'topRated'],
    queryFn: () => movieApi.getMovies({ limit: 50 }),
    select: (data) => data
      .filter(movie => movie.rating && movie.rating >= 4.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 15)
  });

  // Fetch action movies
  const { data: actionMovies = [], isLoading: loadingAction } = useQuery({
    queryKey: ['movies', 'action'],
    queryFn: () => movieApi.getMoviesByGenre('Action', 15)
  });

  // Fetch sci-fi movies
  const { data: sciFiMovies = [], isLoading: loadingSciFi } = useQuery({
    queryKey: ['movies', 'scifi'],
    queryFn: () => movieApi.getMoviesByGenre('Sci-Fi', 15)
  });

  // Fetch drama movies
  const { data: dramaMovies = [], isLoading: loadingDrama } = useQuery({
    queryKey: ['movies', 'drama'],
    queryFn: () => movieApi.getMoviesByGenre('Drama', 15)
  });

  // Fetch comedy movies
  const { data: comedyMovies = [], isLoading: loadingComedy } = useQuery({
    queryKey: ['movies', 'comedy'],
    queryFn: () => movieApi.getMoviesByGenre('Comedy', 15)
  });

  // Fetch recent movies (by release year)
  const { data: recentMovies = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['movies', 'recent'],
    queryFn: () => movieApi.getMovies({ limit: 50 }),
    select: (data) => data
      .filter(movie => movie.release_year && movie.release_year >= 1990)
      .sort((a, b) => (b.release_year || 0) - (a.release_year || 0))
      .slice(0, 15)
  });

  // Fetch popular actors
  const { data: popularActors = [], isLoading: loadingActors } = useQuery({
    queryKey: ['actors', 'popular'],
    queryFn: () => actorApi.getActors({ limit: 20 }),
    select: (data) => data
      .filter(actor => actor.profile_image_url) // Only actors with images
      .slice(0, 15)
  });

  const handleMovieSearchSelect = (movie: MovieOut) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  const handleMoviePlay = (movie: MovieOut) => {
    setSelectedMovieId(movie.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMovieId(null);
  };

  const handleFilteredMoviesChange = (filtered: MovieOut[]) => {
    setFilteredMovies(filtered);
    setIsFiltered(filtered.length !== allMovies.length);
  };

  const handleActorSearchSelect = (actor: ActorOut) => {
    navigate(`/actor/${actor.id}`);
  };

  const handleActorSelect = (actor: ActorOut) => {
    navigate(`/actor/${actor.id}`);
  };

  const isAnyLoading = loadingPopular || loadingTopRated || loadingAction || 
                      loadingSciFi || loadingDrama || loadingComedy || loadingRecent || 
                      loadingAllMovies || loadingActors;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Unified Search */}
      <HeroSection 
        onMovieSelect={handleMovieSearchSelect}
        onActorSelect={handleActorSearchSelect}
      />
      
      {/* Movie Filter */}
      {!isAnyLoading && allMovies.length > 0 && (
        <MovieFilter 
          movies={allMovies}
          onFilteredMoviesChange={handleFilteredMoviesChange}
        />
      )}

      
      {isAnyLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-lg text-muted-foreground">Loading movies...</div>
        </div>
      )}
      

      {/* Filtered Movies Results */}
      {isFiltered && filteredMovies.length > 0 && (
        <div className="mb-8">
          <MovieRow 
            title="Filtered Movies"
            movies={filteredMovies}
            onMoviePlay={handleMoviePlay}
          />
        </div>
      )}

      {/* Movie Rows - Netflix Style (show only when no filters are active) */}
      {!isAnyLoading && !isFiltered && (
        <div className="space-y-8 pb-20">
          {popularMovies.length > 0 && (
            <MovieRow 
              title="Popular Movies" 
              movies={popularMovies}
              onMoviePlay={handleMoviePlay}
            />
          )}
          
          {topRatedMovies.length > 0 && (
            <MovieRow 
              title="Top Rated" 
              movies={topRatedMovies}
              onMoviePlay={handleMoviePlay}
            />
          )}

          {/* Popular Actors Row */}
          {popularActors.length > 0 && (
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">Popular Actors</h2>
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                {popularActors.map((actor) => (
                  <div key={actor.id} className="flex-shrink-0">
                    <ActorCard
                      actor={actor}
                      onClick={() => handleActorSelect(actor)}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {recentMovies.length > 0 && (
            <MovieRow 
              title="Recent Movies" 
              movies={recentMovies}
              onMoviePlay={handleMoviePlay}
            />
          )}
          
          {actionMovies.length > 0 && (
            <MovieRow 
              title="Action Movies" 
              movies={actionMovies}
              onMoviePlay={handleMoviePlay}
            />
          )}

          {sciFiMovies.length > 0 && (
            <MovieRow 
              title="Sci-Fi Movies" 
              movies={sciFiMovies}
              onMoviePlay={handleMoviePlay}
            />
          )}

          {dramaMovies.length > 0 && (
            <MovieRow 
              title="Drama Movies" 
              movies={dramaMovies}
              onMoviePlay={handleMoviePlay}
            />
          )}

          {comedyMovies.length > 0 && (
            <MovieRow 
              title="Comedy Movies" 
              movies={comedyMovies}
              onMoviePlay={handleMoviePlay}
            />
          )}
        </div>
      )}

      {/* No filtered movies found message */}
      {isFiltered && filteredMovies.length === 0 && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">No movies match your filters</h3>
            <p className="text-muted-foreground">Try adjusting your filter criteria to see more results.</p>
          </div>
        </div>
      )}

      {/* No movies found message */}
      {!isAnyLoading && !isFiltered && popularMovies.length === 0 && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">No movies found</h3>
            <p className="text-muted-foreground">Make sure your backend is running and the database is populated.</p>
          </div>
        </div>
      )}

      {/* Movie Details Modal */}
      <MovieDetailsModal
        movieId={selectedMovieId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Index;