import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActorOut } from '@/types/movie';

interface ActorCardProps {
  actor: ActorOut;
  onClick?: () => void;
  showBio?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PLACEHOLDER_ACTOR_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg width="300" height="400" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="400" fill="#1a1a1a"/>
    <circle cx="150" cy="140" r="50" fill="#374151"/>
    <circle cx="135" cy="125" r="8" fill="#6b7280"/>
    <circle cx="165" cy="125" r="8" fill="#6b7280"/>
    <path d="M125 155 Q150 175 175 155" stroke="#6b7280" stroke-width="3" fill="none"/>
    <rect x="100" y="220" width="100" height="120" rx="50" fill="#374151"/>
    <text x="150" y="370" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">Actor</text>
  </svg>
`)}`;

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        container: 'w-32 h-48',
        image: 'h-32',
        title: 'text-sm',
        bio: 'text-xs'
      };
    case 'lg':
      return {
        container: 'w-64 h-96',
        image: 'h-64',
        title: 'text-lg',
        bio: 'text-sm'
      };
    default: // md
      return {
        container: 'w-48 h-72',
        image: 'h-48',
        title: 'text-base',
        bio: 'text-sm'
      };
  }
};

export const ActorCard: React.FC<ActorCardProps> = ({
  actor,
  onClick,
  showBio = false,
  size = 'md'
}) => {
  const sizeClasses = getSizeClasses(size);
  const hasProfileImage = actor.profile_image_url && actor.profile_image_url.trim() !== '';

  return (
    <Card 
      className={`${sizeClasses.container} group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg bg-card border-border`}
      onClick={onClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Profile Image */}
        <div className={`${sizeClasses.image} overflow-hidden rounded-t-lg relative`}>
          <img
            src={hasProfileImage ? actor.profile_image_url : PLACEHOLDER_ACTOR_IMAGE}
            alt={actor.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER_ACTOR_IMAGE;
            }}
          />
          
          {/* TMDb Badge */}
          {actor.tmdb_person_id && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-2 text-xs bg-background/80 backdrop-blur-sm"
            >
              TMDb
            </Badge>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white text-sm font-medium">View Details</span>
          </div>
        </div>

        {/* Actor Info */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 className={`${sizeClasses.title} font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors`}>
              {actor.name}
            </h3>
            
            {showBio && actor.bio && (
              <p className={`${sizeClasses.bio} text-muted-foreground mt-1 line-clamp-3`}>
                {actor.bio}
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-2 flex flex-wrap gap-1">
            {actor.tmdb_person_id && (
              <Badge variant="outline" className="text-xs">
                ID: {actor.tmdb_person_id}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActorCard;
