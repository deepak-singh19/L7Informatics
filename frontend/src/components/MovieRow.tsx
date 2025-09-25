import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { MovieOut } from "@/types/movie";

interface MovieRowProps {
  title: string;
  movies: MovieOut[];
  onMoviePlay?: (movie: MovieOut) => void;
}

export const MovieRow = ({ title, movies, onMoviePlay }: MovieRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 400;
    const newScrollLeft = scrollRef.current.scrollLeft + 
      (direction === 'left' ? -scrollAmount : scrollAmount);
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });

    // Update scroll button states
    setTimeout(() => {
      if (scrollRef.current) {
        setCanScrollLeft(scrollRef.current.scrollLeft > 0);
        setCanScrollRight(
          scrollRef.current.scrollLeft < 
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth
        );
      }
    }, 300);
  };

  // Don't render if no movies
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <div className="relative group/row mb-12">
      <h2 className="text-2xl font-bold text-foreground mb-6 px-6">
        {title}
        <span className="text-sm text-muted-foreground ml-3">({movies.length} movies)</span>
      </h2>
      
      <div className="relative">
        {/* Left scroll button */}
        <Button
          variant="ghost"
          size="sm"
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-30
            w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm
            border border-border shadow-lg
            transition-all duration-300 ease-smooth
            hover:bg-background hover:scale-110
            ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            group-hover/row:opacity-100
          `}
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        {/* Right scroll button */}
        <Button
          variant="ghost"
          size="sm"
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-30
            w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm
            border border-border shadow-lg
            transition-all duration-300 ease-smooth
            hover:bg-background hover:scale-110
            ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            group-hover/row:opacity-100
          `}
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>

        {/* Movies container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-6 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div key={movie.id} className="flex-none w-64">
              <MovieCard movie={movie} onPlay={onMoviePlay} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};