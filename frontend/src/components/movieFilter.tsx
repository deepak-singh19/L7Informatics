import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Search } from "lucide-react";
import { MovieOut } from "@/types/movie";

interface MovieFilterProps {
  movies: MovieOut[];
  onFilteredMoviesChange: (filteredMovies: MovieOut[]) => void;
}

interface FilterState {
  genre: string;
  director: string;
  year: string;
  actor: string;
}

export const MovieFilter = ({ movies, onFilteredMoviesChange }: MovieFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    genre: "",
    director: "",
    year: "",
    actor: ""
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extract unique values for filter options from backend data
  const genres = [...new Set(movies.flatMap(movie => movie.genres.map(g => g.name)))].filter(Boolean).sort();
  const directors = [...new Set(movies.map(movie => movie.director?.name).filter(Boolean))].sort();
  const years = [...new Set(movies.map(movie => movie.release_year?.toString()).filter(Boolean))].sort((a, b) => parseInt(b) - parseInt(a));
  const actors = [...new Set(movies.flatMap(movie => movie.actors.map(a => a.name)))].filter(Boolean).sort();

  const applyFilters = (newFilters: FilterState) => {
    let filtered = movies;

    if (newFilters.genre) {
      filtered = filtered.filter(movie => 
        movie.genres.some(g => g.name === newFilters.genre)
      );
    }
    if (newFilters.director) {
      filtered = filtered.filter(movie => 
        movie.director?.name.toLowerCase().includes(newFilters.director.toLowerCase())
      );
    }
    if (newFilters.year) {
      filtered = filtered.filter(movie => 
        movie.release_year?.toString() === newFilters.year
      );
    }
    if (newFilters.actor) {
      filtered = filtered.filter(movie => 
        movie.actors.some(a => a.name.toLowerCase().includes(newFilters.actor.toLowerCase()))
      );
    }

    onFilteredMoviesChange(filtered);
  };

  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearFilter = (filterType: keyof FilterState) => {
    const newFilters = { ...filters, [filterType]: "" };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters = { genre: "", director: "", year: "", actor: "" };
    setFilters(emptyFilters);
    onFilteredMoviesChange(movies);
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== "").length;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearAllFilters} className="text-sm">
            Clear all filters
          </Button>
        )}
      </div>

      {isFilterOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-card rounded-lg border border-border">
          {/* Genre Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Genre</label>
            <Select value={filters.genre} onValueChange={(value) => handleFilterChange("genre", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All genres" />
              </SelectTrigger>
              <SelectContent>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.genre && (
              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                {filters.genre}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => clearFilter("genre")}
                />
              </Badge>
            )}
          </div>

          {/* Director Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Director</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search directors..."
                value={filters.director}
                onChange={(e) => handleFilterChange("director", e.target.value)}
                className="pl-10"
              />
            </div>
            {filters.director && (
              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                {filters.director}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => clearFilter("director")}
                />
              </Badge>
            )}
          </div>

          {/* Year Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Release Year</label>
            <Select value={filters.year} onValueChange={(value) => handleFilterChange("year", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.year && (
              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                {filters.year}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => clearFilter("year")}
                />
              </Badge>
            )}
          </div>

          {/* Actor Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Actor</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search actors..."
                value={filters.actor}
                onChange={(e) => handleFilterChange("actor", e.target.value)}
                className="pl-10"
              />
            </div>
            {filters.actor && (
              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                {filters.actor}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => clearFilter("actor")}
                />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};