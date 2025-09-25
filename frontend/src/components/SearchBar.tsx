import { useState } from "react";
import { Search, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ 
  onSearch, 
  placeholder = "Search movies, actors, directors..." 
}: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Film className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-12 pr-20 py-6 text-lg bg-card/50 backdrop-blur-sm border-border
            focus:border-primary focus:shadow-search-glow
            transition-all duration-300 ease-smooth
            placeholder:text-muted-foreground"
        />
        
        <Button
          type="submit"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2
            bg-primary hover:bg-primary/90
            text-primary-foreground
            transition-all duration-300 ease-smooth
            hover:scale-105"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </form>
  );
};