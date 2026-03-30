'use client';
// Mama Fua — Cleaner Search Filters Component
// KhimTech | 2026

import { useState } from 'react';
import { 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Filter, 
  ChevronDown, 
  X,
  Users,
  Languages
} from 'lucide-react';

interface SearchFilters {
  location: string;
  serviceType: string;
  date: string;
  time: string;
  minRating: number;
  priceRange: [number, number];
  gender: string;
  language: string;
  distance: number;
}

interface CleanerSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  services: Array<{ id: string; name: string }>;
  className?: string;
}

export function CleanerSearchFilters({
  filters,
  onFiltersChange,
  services,
  className = '',
}: CleanerSearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Count active filters
  useState(() => {
    let count = 0;
    if (filters.serviceType) count++;
    if (filters.date) count++;
    if (filters.time) count++;
    if (filters.minRating > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++;
    if (filters.gender) count++;
    if (filters.language) count++;
    if (filters.distance < 20) count++; // Default is 20km
    setActiveFilterCount(count);
  });

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilter = (key: keyof SearchFilters) => {
    const defaultValues: Partial<SearchFilters> = {
      serviceType: '',
      date: '',
      time: '',
      minRating: 0,
      priceRange: [0, 10000],
      gender: '',
      language: '',
      distance: 20,
    };
    
    onFiltersChange({
      ...filters,
      [key]: defaultValues[key],
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      location: filters.location, // Keep location
      serviceType: '',
      date: '',
      time: '',
      minRating: 0,
      priceRange: [0, 10000],
      gender: '',
      language: '',
      distance: 20,
    });
  };

  const ratingOptions = [
    { value: 0, label: 'All Ratings' },
    { value: 3.5, label: '3.5+ Stars' },
    { value: 4.0, label: '4.0+ Stars' },
    { value: 4.5, label: '4.5+ Stars' },
  ];

  const distanceOptions = [
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 15, label: '15 km' },
    { value: 20, label: '20 km' },
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Service Type */}
        <div className="relative">
          <select
            value={filters.serviceType}
            onChange={(e) => updateFilter('serviceType', e.target.value)}
            className="input appearance-none pr-10"
          >
            <option value="">All Services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-ink-400" />
        </div>

        {/* Date */}
        <input
          type="date"
          value={filters.date}
          onChange={(e) => updateFilter('date', e.target.value)}
          className="input"
          min={new Date().toISOString().split('T')[0]}
        />

        {/* Time */}
        <div className="relative">
          <select
            value={filters.time}
            onChange={(e) => updateFilter('time', e.target.value)}
            className="input appearance-none pr-10"
          >
            <option value="">Any Time</option>
            {timeSlots.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-ink-400" />
        </div>

        {/* Rating */}
        <div className="relative">
          <select
            value={filters.minRating}
            onChange={(e) => updateFilter('minRating', parseFloat(e.target.value))}
            className="input appearance-none pr-10"
          >
            {ratingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Star className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-ink-400" />
        </div>

        {/* Distance */}
        <div className="relative">
          <select
            value={filters.distance}
            onChange={(e) => updateFilter('distance', parseInt(e.target.value))}
            className="input appearance-none pr-10"
          >
            {distanceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-ink-400" />
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`btn-ghost px-4 py-2 ${showAdvanced ? 'bg-brand-50 text-brand-700' : ''}`}
        >
          <Filter className="mr-2 h-4 w-4" />
          Advanced
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="btn-ghost px-4 py-2 text-red-600 hover:bg-red-50"
          >
            <X className="mr-2 h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <h3 className="font-semibold text-ink-900 mb-4">Advanced Filters</h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Price Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">
                <DollarSign className="mr-1 inline h-3 w-3" />
                Price Range (KES)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                  className="input w-24"
                  placeholder="Min"
                  min="0"
                />
                <span className="text-ink-500">to</span>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="input w-24"
                  placeholder="Max"
                  min="0"
                />
              </div>
            </div>

            {/* Gender Preference */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">
                <Users className="mr-1 inline h-3 w-3" />
                Gender Preference
              </label>
              <select
                value={filters.gender}
                onChange={(e) => updateFilter('gender', e.target.value)}
                className="input"
              >
                <option value="">No Preference</option>
                <option value="male">Male Cleaner</option>
                <option value="female">Female Cleaner</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">
                <Languages className="mr-1 inline h-3 w-3" />
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => updateFilter('language', e.target.value)}
                className="input"
              >
                <option value="">Any Language</option>
                <option value="english">English</option>
                <option value="swahili">Swahili</option>
                <option value="both">English & Swahili</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <span className="text-sm font-medium text-ink-700">Active Filters:</span>
            
            {filters.serviceType && (
              <div className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1">
                <span className="text-sm text-brand-700">Service: {filters.serviceType}</span>
                <button
                  onClick={() => clearFilter('serviceType')}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {filters.date && (
              <div className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1">
                <span className="text-sm text-brand-700">Date: {filters.date}</span>
                <button
                  onClick={() => clearFilter('date')}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {filters.time && (
              <div className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1">
                <span className="text-sm text-brand-700">Time: {filters.time}</span>
                <button
                  onClick={() => clearFilter('time')}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {filters.minRating > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1">
                <span className="text-sm text-brand-700">Rating: {filters.minRating}+</span>
                <button
                  onClick={() => clearFilter('minRating')}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) && (
              <div className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1">
                <span className="text-sm text-brand-700">
                  Price: {filters.priceRange[0]} - {filters.priceRange[1]}
                </span>
                <button
                  onClick={() => clearFilter('priceRange')}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {filters.gender && (
              <div className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1">
                <span className="text-sm text-brand-700">Gender: {filters.gender}</span>
                <button
                  onClick={() => clearFilter('gender')}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {filters.language && (
              <div className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1">
                <span className="text-sm text-brand-700">Language: {filters.language}</span>
                <button
                  onClick={() => clearFilter('language')}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {filters.distance < 20 && (
              <div className="flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1">
                <span className="text-sm text-brand-700">Distance: {filters.distance}km</span>
                <button
                  onClick={() => clearFilter('distance')}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
