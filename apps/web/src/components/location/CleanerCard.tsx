'use client';
// Mama Fua — Cleaner Card Component
// KhimTech | 2026

import { useState } from 'react';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  Heart,
  Calendar,
  DollarSign,
  Award,
  User
} from 'lucide-react';

interface Service {
  name: string;
  customPrice: number;
}

interface Cleaner {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  rating: number;
  totalReviews: number;
  distance: number;
  services: Service[];
  verificationStatus: string;
  isAvailable: boolean;
  nextAvailable?: string;
  bio: string;
  totalJobs?: number;
  acceptanceRate?: number;
  languages?: string[];
}

interface CleanerCardProps {
  cleaner: Cleaner;
  onSelect: (cleaner: Cleaner) => void;
  onContact: (cleaner: Cleaner, type: 'call' | 'message') => void;
  onFavorite: (cleanerId: string) => void;
  isFavorite?: boolean;
  className?: string;
  compact?: boolean;
}

export function CleanerCard({ 
  cleaner, 
  onSelect, 
  onContact, 
  onFavorite,
  isFavorite = false,
  className = '',
  compact = false 
}: CleanerCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getNextAvailable = () => {
    if (!cleaner.nextAvailable) return 'Available now';
    
    const nextDate = new Date(cleaner.nextAvailable);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (nextDate.toDateString() === today.toDateString()) {
      return `Today at ${nextDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    return nextDate.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-mint-600';
    if (rating >= 3.5) return 'text-amber-600';
    return 'text-slate-600';
  };

  const displayServices = compact ? cleaner.services.slice(0, 2) : cleaner.services.slice(0, 3);

  return (
    <div 
      className={`group relative rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-brand-300 hover:shadow-lg ${
        compact ? 'p-4' : 'p-6'
      } ${className} ${isHovered ? 'ring-2 ring-brand-100' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite Button */}
      <button
        onClick={() => onFavorite(cleaner.id)}
        className="absolute top-4 right-4 z-10 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-slate-50"
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart 
          className={`h-4 w-4 transition-colors ${
            isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-500'
          }`} 
        />
      </button>

      <div className="flex gap-4">
        {/* Profile Image */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className={`flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold ${
              compact ? 'h-12 w-12 text-lg' : 'h-16 w-16 text-2xl'
            }`}>
              {cleaner.avatarUrl && !imageError ? (
                <img 
                  src={cleaner.avatarUrl} 
                  alt={`${cleaner.firstName} ${cleaner.lastName}`}
                  className="h-full w-full rounded-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                getInitials(cleaner.firstName, cleaner.lastName)
              )}
            </div>
            
            {/* Verification Badge */}
            {cleaner.verificationStatus === 'VERIFIED' && (
              <div className={`absolute -bottom-1 -right-1 rounded-full bg-mint-600 p-1 ${
                compact ? 'h-5 w-5' : 'h-6 w-6'
              }`}>
                <ShieldCheck className="h-full w-full text-white" />
              </div>
            )}
            
            {/* Availability Indicator */}
            <div className={`absolute bottom-0 left-0 rounded-full ${
              cleaner.isAvailable ? 'bg-green-500' : 'bg-red-500'
            } ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </div>
        </div>

        {/* Cleaner Info */}
        <div className="flex-1 min-w-0">
          {/* Name and Rating */}
          <div className="mb-2">
            <h3 className={`font-semibold text-ink-900 group-hover:text-brand-700 transition-colors ${
              compact ? 'text-base' : 'text-lg'
            }`}>
              {cleaner.firstName} {cleaner.lastName}
            </h3>
            
            <div className="flex items-center gap-3">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className={`h-4 w-4 fill-current ${getRatingColor(cleaner.rating)}`} />
                <span className={`text-sm font-medium ${getRatingColor(cleaner.rating)}`}>
                  {cleaner.rating.toFixed(1)}
                </span>
                <span className="text-xs text-ink-500">({cleaner.totalReviews})</span>
              </div>

              {/* Distance */}
              <div className="flex items-center gap-1 text-sm text-ink-600">
                <MapPin className="h-3 w-3" />
                {formatDistance(cleaner.distance)}
              </div>

              {/* Status */}
              <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                cleaner.isAvailable 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {cleaner.isAvailable ? 'Available' : 'Busy'}
              </div>
            </div>
          </div>

          {/* Bio (compact mode only) */}
          {compact && cleaner.bio && (
            <p className="mb-3 text-sm text-ink-600 line-clamp-2">
              {cleaner.bio}
            </p>
          )}

          {/* Services */}
          {displayServices.length > 0 && (
            <div className={`${compact ? 'mb-3' : 'mb-4'}`}>
              <h4 className={`font-medium text-ink-900 mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
                Services
              </h4>
              <div className="space-y-1">
                {displayServices.map((service, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={`text-ink-700 ${compact ? 'text-sm' : 'text-base'}`}>
                      {service.name}
                    </span>
                    <span className={`font-semibold text-ink-900 ${compact ? 'text-sm' : 'text-base'}`}>
                      {formatPrice(service.customPrice)}
                    </span>
                  </div>
                ))}
                {cleaner.services.length > (compact ? 2 : 3) && (
                  <p className="text-xs text-ink-500">
                    +{cleaner.services.length - (compact ? 2 : 3)} more services
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Next Available */}
          {!compact && (
            <div className="mb-4 flex items-center gap-2 text-sm text-ink-600">
              <Clock className="h-4 w-4" />
              <span>{getNextAvailable()}</span>
            </div>
          )}

          {/* Stats (full card only) */}
          {!compact && (cleaner.totalJobs || cleaner.acceptanceRate) && (
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              {cleaner.totalJobs && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-ink-400" />
                  <div>
                    <p className="font-semibold text-ink-900">{cleaner.totalJobs}</p>
                    <p className="text-ink-500">Jobs Done</p>
                  </div>
                </div>
              )}
              
              {cleaner.acceptanceRate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-ink-400" />
                  <div>
                    <p className="font-semibold text-ink-900">{Math.round(cleaner.acceptanceRate * 100)}%</p>
                    <p className="text-ink-500">Acceptance</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Languages (full card only) */}
          {!compact && cleaner.languages && cleaner.languages.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {cleaner.languages.map((language, index) => (
                  <span 
                    key={index}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex gap-2 ${compact ? 'mt-3' : 'mt-6'}`}>
        <button
          onClick={() => onSelect(cleaner)}
          className={`btn-primary flex-1 ${
            compact ? 'py-2 text-sm' : 'py-3'
          }`}
        >
          <User className="mr-2 h-4 w-4" />
          View Profile
        </button>
        
        {!compact && (
          <>
            <button
              onClick={() => onContact(cleaner, 'call')}
              className="btn-secondary px-4 py-3"
              title="Call cleaner"
            >
              <Phone className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onContact(cleaner, 'message')}
              className="btn-secondary px-4 py-3"
              title="Message cleaner"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Hover overlay (full card only) */}
      {!compact && isHovered && (
        <div className="absolute inset-0 rounded-xl bg-brand-600/95 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-lg font-semibold mb-2">Quick Book</p>
            <p className="text-sm mb-4">
              {cleaner.firstName} is available for immediate booking
            </p>
            <button
              onClick={() => onSelect(cleaner)}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-600 hover:bg-slate-50"
            >
              Book Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
