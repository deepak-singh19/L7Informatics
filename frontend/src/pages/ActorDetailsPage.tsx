import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Calendar, Star, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActorDetailOut, MovieOut } from '@/types/movie';
import { actorApi } from '@/services/api';
import { MovieCard } from '@/components/MovieCard';

const PLACEHOLDER_ACTOR_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg width="400" height="500" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="500" fill="#1a1a1a"/>
    <circle cx="200" cy="180" r="80" fill="#374151"/>
    <circle cx="170" cy="150" r="12" fill="#6b7280"/>
    <circle cx="230" cy="150" r="12" fill="#6b7280"/>
    <path d="M160 200 Q200 230 240 200" stroke="#6b7280" stroke-width="4" fill="none"/>
    <rect x="140" y="280" width="120" height="150" rx="60" fill="#374151"/>
    <text x="200" y="460" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle">Actor Profile</text>
  </svg>
`)}`;

export const ActorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actor, setActor] = useState<ActorDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActor = async () => {
      if (!id) {
        setError('Actor ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const actorData = await actorApi.getActor(Number(id));
        setActor(actorData);
      } catch (err) {
        console.error('Failed to fetch actor:', err);
        setError('Failed to load actor details');
      } finally {
        setLoading(false);
      }
    };

    fetchActor();
  }, [id]);

  const handleMovieClick = (movieId: number) => {
    navigate(`/movie/${movieId}`);
  };

  const getMovieStats = (movies: MovieOut[]) => {
    if (!movies.length) return { totalMovies: 0, avgRating: 0, genres: [] };

    const totalMovies = movies.length;
    const ratingsSum = movies.reduce((sum, movie) => sum + (movie.rating || 0), 0);
    const avgRating = totalMovies > 0 ? ratingsSum / totalMovies : 0;
    
    const genreCount = new Map();
    movies.forEach(movie => {
      movie.genres.forEach(genre => {
        genreCount.set(genre.name, (genreCount.get(genre.name) || 0) + 1);
      });
    });
    
    const sortedGenres = Array.from(genreCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    return { totalMovies, avgRating, genres: sortedGenres };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading actor details...</p>
        </div>
      </div>
    );
  }

  if (error || !actor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Actor Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'The actor you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const stats = getMovieStats(actor.movies);
  const hasProfileImage = actor.profile_image_url && actor.profile_image_url.trim() !== '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-xl font-bold text-foreground">{actor.name}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Actor Profile */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* Profile Image */}
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden mb-6 bg-muted">
                  <img
                    src={hasProfileImage ? actor.profile_image_url : PLACEHOLDER_ACTOR_IMAGE}
                    alt={actor.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_ACTOR_IMAGE;
                    }}
                  />
                </div>

                {/* Actor Info */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">{actor.name}</h2>
                    <div className="flex flex-wrap gap-2">
                      {actor.tmdb_person_id && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <ExternalLink className="w-3 h-3" />
                          <span>TMDb ID: {actor.tmdb_person_id}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Biography */}
                  {actor.bio && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Biography</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {actor.bio}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-border my-4"></div>

                  {/* Quick Stats */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Career Statistics</h3>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Film className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Movies:</span>
                      <span className="font-medium text-foreground">{stats.totalMovies}</span>
                    </div>

                    {stats.avgRating > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Avg Rating:</span>
                        <span className="font-medium text-foreground">{stats.avgRating.toFixed(1)}</span>
                      </div>
                    )}

                    {stats.genres.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Most Common Genres:</p>
                        <div className="flex flex-wrap gap-1">
                          {stats.genres.map(genre => (
                            <Badge key={genre} variant="outline" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Filmography */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Film className="w-5 h-5" />
                  <span>Filmography ({actor.movies.length} movies)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {actor.movies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {actor.movies
                      .sort((a, b) => (b.release_year || 0) - (a.release_year || 0))
                      .map((movie) => (
                        <div key={movie.id} className="cursor-pointer">
                          <MovieCard
                            movie={movie}
                            onPlay={() => handleMovieClick(movie.id)}
                          />
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Movies Found</h3>
                    <p className="text-muted-foreground">
                      This actor doesn't appear in any movies in our database yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorDetailsPage;
