import { UnifiedSearch } from "./UnifiedSearch";
import { MovieOut, ActorOut } from "@/types/movie";

interface HeroSectionProps {
  onMovieSelect?: (movie: MovieOut) => void;
  onActorSelect?: (actor: ActorOut) => void;
}

export const HeroSection = ({ onMovieSelect, onActorSelect }: HeroSectionProps) => {
  return (
    <section className="relative py-24 px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-hero-gradient" />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-bold mb-4
            bg-gradient-to-r from-foreground via-primary to-foreground 
            bg-clip-text text-transparent
            animate-pulse">
            CineExplorer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover your next favorite movie, explore talented actors, 
            and dive deep into the world of cinema
          </p>
        </div>
        
        <div className="mb-12">
          <UnifiedSearch 
            onMovieSelect={onMovieSelect}
            onActorSelect={onActorSelect}
            placeholder="Search movies and actors..."
            className="max-w-lg mx-auto"
          />
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-card/30 backdrop-blur-sm rounded-lg p-6 border border-border">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎬</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Movies</h3>
            <p className="text-muted-foreground text-sm">
              Explore thousands of movies across all genres and decades
            </p>
          </div>
          
          <div className="bg-card/30 backdrop-blur-sm rounded-lg p-6 border border-border">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Actors</h3>
            <p className="text-muted-foreground text-sm">
              Discover talented actors and their filmography
            </p>
          </div>
          
          <div className="bg-card/30 backdrop-blur-sm rounded-lg p-6 border border-border">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎭</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Genres</h3>
            <p className="text-muted-foreground text-sm">
              Browse by your favorite genres and discover new ones
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};