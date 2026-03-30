'use client';
// Mama Fua — Address Autocomplete Component
// KhimTech | 2026

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter your address...',
  className = '',
  disabled = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Generate session token for autocomplete billing optimization
  useEffect(() => {
    setSessionToken(Math.random().toString(36).substring(7));
  }, []);

  // Debounced search
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `/api/v1/location/autocomplete?input=${encodeURIComponent(query)}&sessiontoken=${sessionToken}&components=country:ke`
      );
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.predictions || []);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    
    try {
      // Get detailed place information
      const response = await fetch(
        `/api/v1/location/place?place_id=${suggestion.place_id}&sessiontoken=${sessionToken}`
      );
      const data = await response.json();
      
      if (data.success && data.result) {
        onSelect({
          ...suggestion,
          structured_formatting: data.result.structured_formatting || {
            main_text: suggestion.description,
            secondary_text: ''
          }
        });
      }
    } catch (error) {
      console.error('Place details error:', error);
      onSelect(suggestion);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={inputRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="input w-full pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-brand-600" />
        )}
        {value && !isLoading && (
          <button
            onClick={() => {
              onChange('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.place_id}-${index}`}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-ink-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900">
                      {suggestion.structured_formatting?.main_text || suggestion.description}
                    </p>
                    {suggestion.structured_formatting?.secondary_text && (
                      <p className="text-xs text-ink-500">
                        {suggestion.structured_formatting.secondary_text}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
