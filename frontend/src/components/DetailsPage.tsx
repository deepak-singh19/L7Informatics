import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Calendar, User, Film, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MovieOut } from "@/types/movie";
import { movieApi } from "@/services/api";
import { toast } from "@/hooks/use-toast";

// Same placeholder image as other components
const PLACEHOLDER_POSTER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="600" fill="#1a1a1a"/>
    <rect x="150" y="220" width="100" height="120" rx="8" fill="#374151"/>
    <circle cx="200" cy="280" r="20" fill="#6b7280"/>
    <polygon points="190,270 190,290 210,280" fill="#ffffff"/>
    <text x="200" y="380" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">Movie Poster</text>
  </svg>
`)}`;

const DetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const movieData = await movieApi.getMovie(Number(id));
        setMovie(movieData);
      } catch (error) {
        console.error('Error fetching movie:', error);
        toast({
          title: "Error",
          description: "Failed to load movie details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading movie details...</div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Movie Not Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          onClick={() => navigate("/")} 
          variant="ghost" 
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Movies
        </Button>

        {/* Movie Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Poster */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden shadow-movie-card">
              <div className="aspect-[2/3] relative">
                <img
                  src={movie.poster_url || PLACEHOLDER_POSTER}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_POSTER;
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Movie Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{movie.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{movie.release_year || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-foreground font-medium">
                    {movie.rating ? movie.rating.toFixed(1) : 'N/A'}/5.0
                  </span>
                  <span className="text-sm">({movie.rating_count} ratings)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre) => (
                  <Badge key={genre.id} variant="secondary">
                    {genre.name}
                  </Badge>
                ))}
              </div>
              {movie.description && (
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {movie.description}
                </p>
              )}
            </div>

            {/* Director */}
            {movie.director && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Film className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Director</h2>
                  </div>
                  <div className="p-3 bg-accent/50 rounded-lg border border-border">
                    <p className="font-medium text-foreground">{movie.director.name}</p>
                    {movie.director.bio && (
                      <p className="text-sm text-muted-foreground mt-1">{movie.director.bio}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cast */}
            {movie.actors && movie.actors.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Cast</h2>
                    <span className="text-sm text-muted-foreground">({movie.actors.length} actors)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {movie.actors.map((actor) => (
                      <div
                        key={actor.id}
                        className="p-3 bg-accent/50 rounded-lg border border-border cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => navigate(`/actor/${actor.id}`)}
                      >
                        <p className="font-medium text-foreground hover:text-primary transition-colors">{actor.name}</p>
                        {actor.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{actor.bio}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Movie Metadata */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Movie Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">MovieLens ID:</span>
                    <span className="ml-2 font-medium">{movie.ml_id}</span>
                  </div>
                  {movie.tmdb_id && (
                    <div>
                      <span className="text-muted-foreground">TMDb ID:</span>
                      <span className="ml-2 font-medium">{movie.tmdb_id}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Rating Count:</span>
                    <span className="ml-2 font-medium">{movie.rating_count}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Release Year:</span>
                    <span className="ml-2 font-medium">{movie.release_year || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;