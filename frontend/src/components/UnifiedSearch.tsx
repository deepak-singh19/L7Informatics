import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, User, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MovieOut, ActorOut } from '@/types/movie';
import { movieApi, actorApi } from '@/services/api';

interface UnifiedSearchProps {
  onMovieSelect?: (movie: MovieOut) => void;
  onActorSelect?: (actor: ActorOut) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResults {
  movies: MovieOut[];
  actors: ActorOut[];
}

export const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  onMovieSelect,
  onActorSelect,
  placeholder = "Search movies and actors...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ movies: [], actors: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults({ movies: [], actors: [] });
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const [movieResults, actorResults] = await Promise.all([
        movieApi.searchMovies(searchQuery),
        actorApi.searchActors(searchQuery)
      ]);
      
      const searchResults = {
        movies: movieResults.slice(0, 8), // Limit results
        actors: actorResults.slice(0, 8)
      };
      
      setResults(searchResults);
      setIsOpen(searchResults.movies.length > 0 || searchResults.actors.length > 0);
      
      // Auto-select appropriate tab based on results
      if (searchResults.movies.length > 0 && searchResults.actors.length === 0) {
        setActiveTab('movies');
      } else if (searchResults.actors.length > 0 && searchResults.movies.length === 0) {
        setActiveTab('actors');
      } else {
        setActiveTab('all');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults({ movies: [], actors: [] });
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleMovieSelect = (movie: MovieOut) => {
    setQuery(movie.title);
    setIsOpen(false);
    onMovieSelect?.(movie);
  };

  const handleActorSelect = (actor: ActorOut) => {
    setQuery(actor.name);
    setIsOpen(false);
    onActorSelect?.(actor);
  };

  const handleClear = () => {
    setQuery('');
    setResults({ movies: [], actors: [] });
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const PLACEHOLDER_POSTER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="80" fill="#374151" rx="4"/>
      <rect x="20" y="25" width="20" height="25" rx="2" fill="#6b7280"/>
      <circle cx="30" cy="37" r="5" fill="#9ca3af"/>
      <polygon points="25,32 25,42 35,37" fill="#ffffff"/>
    </svg>
  `)}`;

  const PLACEHOLDER_ACTOR_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" fill="#374151" rx="30"/>
      <circle cx="30" cy="20" r="8" fill="#6b7280"/>
      <circle cx="30" cy="45" r="12" fill="#6b7280"/>
    </svg>
  `)}`;

  const totalResults = results.movies.length + results.actors.length;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (totalResults > 0) setIsOpen(true);
          }}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[500px] overflow-hidden bg-background border shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </div>
              </div>
            ) : totalResults > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                  <TabsTrigger value="all" className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>All ({totalResults})</span>
                  </TabsTrigger>
                  <TabsTrigger value="movies" className="flex items-center space-x-1">
                    <Film className="w-3 h-3" />
                    <span>Movies ({results.movies.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="actors" className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>Actors ({results.actors.length})</span>
                  </TabsTrigger>
                </TabsList>

                <div className="max-h-96 overflow-y-auto">
                  <TabsContent value="all" className="m-0">
                    <div className="py-2">
                      {/* Movies Section */}
                      {results.movies.length > 0 && (
                        <div className="mb-4">
                          <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                            Movies
                          </div>
                          {results.movies.slice(0, 4).map((movie) => (
                            <button
                              key={movie.id}
                              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center space-x-3"
                              onClick={() => handleMovieSelect(movie)}
                            >
                              <img
                                src={movie.poster_url || PLACEHOLDER_POSTER}
                                alt={movie.title}
                                className="w-10 h-12 rounded object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = PLACEHOLDER_POSTER;
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-foreground truncate">
                                    {movie.title}
                                  </span>
                                  {movie.release_year && (
                                    <Badge variant="outline" className="text-xs">
                                      {movie.release_year}
                                    </Badge>
                                  )}
                                </div>
                                {movie.director && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    Directed by {movie.director.name}
                                  </p>
                                )}
                              </div>
                              <Film className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Actors Section */}
                      {results.actors.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                            Actors
                          </div>
                          {results.actors.slice(0, 4).map((actor) => (
                            <button
                              key={actor.id}
                              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center space-x-3"
                              onClick={() => handleActorSelect(actor)}
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                <img
                                  src={actor.profile_image_url || PLACEHOLDER_ACTOR_IMAGE}
                                  alt={actor.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = PLACEHOLDER_ACTOR_IMAGE;
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-foreground truncate">
                                    {actor.name}
                                  </span>
                                  {actor.tmdb_person_id && (
                                    <Badge variant="secondary" className="text-xs">
                                      TMDb
                                    </Badge>
                                  )}
                                </div>
                                {actor.bio && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {actor.bio}
                                  </p>
                                )}
                              </div>
                              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="movies" className="m-0">
                    <div className="py-2">
                      {results.movies.map((movie) => (
                        <button
                          key={movie.id}
                          className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center space-x-3"
                          onClick={() => handleMovieSelect(movie)}
                        >
                          <img
                            src={movie.poster_url || PLACEHOLDER_POSTER}
                            alt={movie.title}
                            className="w-10 h-12 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = PLACEHOLDER_POSTER;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground truncate">
                                {movie.title}
                              </span>
                              {movie.release_year && (
                                <Badge variant="outline" className="text-xs">
                                  {movie.release_year}
                                </Badge>
                              )}
                            </div>
                            {movie.director && (
                              <p className="text-sm text-muted-foreground truncate">
                                Directed by {movie.director.name}
                              </p>
                            )}
                            {movie.rating && (
                              <p className="text-xs text-muted-foreground">
                                ⭐ {movie.rating.toFixed(1)}
                              </p>
                            )}
                          </div>
                          <Film className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="actors" className="m-0">
                    <div className="py-2">
                      {results.actors.map((actor) => (
                        <button
                          key={actor.id}
                          className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center space-x-3"
                          onClick={() => handleActorSelect(actor)}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <img
                              src={actor.profile_image_url || PLACEHOLDER_ACTOR_IMAGE}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_ACTOR_IMAGE;
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground truncate">
                                {actor.name}
                              </span>
                              {actor.tmdb_person_id && (
                                <Badge variant="secondary" className="text-xs">
                                  TMDb
                                </Badge>
                              )}
                            </div>
                            {actor.bio && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {actor.bio}
                              </p>
                            )}
                          </div>
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm">Try searching for movies or actors</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedSearch;
