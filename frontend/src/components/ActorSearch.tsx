import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActorOut } from '@/types/movie';
import { actorApi } from '@/services/api';

interface ActorSearchProps {
  onActorSelect?: (actor: ActorOut) => void;
  placeholder?: string;
  className?: string;
}

export const ActorSearch: React.FC<ActorSearchProps> = ({
  onActorSelect,
  placeholder = "Search actors...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ActorOut[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
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
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const actors = await actorApi.searchActors(searchQuery);
      setResults(actors);
      setIsOpen(actors.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Actor search failed:', error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleActorSelect = (actor: ActorOut) => {
    setQuery(actor.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onActorSelect?.(actor);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleActorSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const PLACEHOLDER_ACTOR_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="60" fill="#374151" rx="30"/>
      <circle cx="30" cy="20" r="8" fill="#6b7280"/>
      <circle cx="30" cy="45" r="12" fill="#6b7280"/>
    </svg>
  `)}`;

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
            if (results.length > 0) setIsOpen(true);
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
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto bg-background border shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching actors...</span>
                </div>
              </div>
            ) : results.length > 0 ? (
              <ul className="py-2">
                {results.map((actor, index) => (
                  <li key={actor.id}>
                    <button
                      className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center space-x-3 ${
                        index === selectedIndex ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleActorSelect(actor)}
                    >
                      {/* Actor Image */}
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

                      {/* Actor Info */}
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

                      {/* Arrow Icon */}
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No actors found for "{query}"</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActorSearch;
