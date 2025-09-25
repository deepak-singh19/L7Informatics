import { useState } from "react";
import { Star, Play, Calendar, User, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MovieOut } from "@/types/movie";

// Create a simple SVG placeholder to avoid any external network calls
const PLACEHOLDER_POSTER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="600" fill="#1a1a1a"/>
    <rect x="150" y="220" width="100" height="120" rx="8" fill="#374151"/>
    <circle cx="200" cy="280" r="20" fill="#6b7280"/>
    <polygon points="190,270 190,290 210,280" fill="#ffffff"/>
    <text x="200" y="380" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">Movie Poster</text>
  </svg>
`)}`;

interface MovieCardProps {
  movie: MovieOut;
  onPlay?: (movie: MovieOut) => void;
}

export const MovieCard = ({ movie, onPlay }: MovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Use poster_url from backend if available, otherwise use placeholder
  const posterUrl = movie.poster_url || PLACEHOLDER_POSTER;
  
  // Format rating to 1 decimal place
  const formattedRating = movie.rating ? movie.rating.toFixed(1) : 'N/A';
  
  // Get primary genre
  const primaryGenre = movie.genres.length > 0 ? movie.genres[0].name : 'Unknown';
  
  // Get director name
  const directorName = movie.director?.name || 'Unknown Director';
  
  // Get actor count
  const actorCount = movie.actors.length;

  return (
    <Card
      className="relative group cursor-pointer bg-card border-border overflow-hidden
        transition-all duration-300 ease-smooth
        shadow-movie-card hover:shadow-movie-card-hover
        hover:scale-110 hover:z-20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay?.(movie)}
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-gray-800">
        {posterUrl && posterUrl !== PLACEHOLDER_POSTER ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-smooth
              group-hover:scale-105"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src = PLACEHOLDER_POSTER;
            }}
          />
        ) : (
          <img
            src={PLACEHOLDER_POSTER}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-smooth
              group-hover:scale-105"
          />
        )}
        
        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
          transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`
              w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm
              flex items-center justify-center
              transition-all duration-300 ease-bounce
              ${isHovered ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
            `}>
              <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Movie info */}
          <div className={`absolute bottom-0 left-0 right-0 p-4
            transition-all duration-300 ease-smooth
            ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
          `}>
            <h3 className="font-bold text-foreground text-lg mb-1 line-clamp-2">
              {movie.title}
            </h3>
            
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{movie.release_year || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-foreground font-medium">{formattedRating}</span>
                <span className="text-xs text-muted-foreground">({movie.rating_count})</span>
              </div>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{directorName}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{actorCount} actors</span>
              </div>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-1">
              {movie.genres.slice(0, 2).map((genre) => (
                <span key={genre.id} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                  {genre.name}
                </span>
              ))}
              {movie.genres.length > 2 && (
                <span className="text-xs text-muted-foreground">+{movie.genres.length - 2}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};