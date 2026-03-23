'use client';
// Mama Fua — Step 2: Location
// KhimTech | 2026

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationApi, userApi } from '@/lib/api';
import { MapPin, Home, Plus, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import type { BookingDraft } from '@/app/book/page';
import type { AutocompleteResult, PlaceDetail } from '@mama-fua/shared';

interface Props {
  draft: Partial<BookingDraft>;
  onChange: (updates: Partial<BookingDraft>) => void;
  onNext: () => void;
}

interface SavedAddress {
  id: string;
  label: string;
  addressLine1: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export default function StepLocation({ draft, onChange, onNext }: Props) {
  const [mode, setMode] = useState<'saved' | 'new'>(draft.addressId ? 'saved' : 'saved');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetail | null>(null);
  const [sessionToken] = useState(() => crypto.randomUUID());
  const [isSearching, setIsSearching] = useState(false);
  const [label, setLabel] = useState('Home');
  const [instructions, setInstructions] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { data: savedRes } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => userApi.me(),
  });
  const savedAddresses: SavedAddress[] = savedRes?.data?.data?.addresses ?? [];

  // Debounced autocomplete
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await locationApi.autocomplete(value, sessionToken);
        setSuggestions(res.data.data ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [sessionToken]);

  const handleSelectSuggestion = async (suggestion: AutocompleteResult) => {
    setSuggestions([]);
    setQuery(suggestion.description);
    setIsSearching(true);
    try {
      const res = await locationApi.place(suggestion.placeId);
      const place: PlaceDetail = res.data.data;
      setSelectedPlace(place);
      onChange({
        addressId: undefined,
        address: {
          label,
          addressLine1: place.formattedAddress,
          area: place.area,
          city: place.city,
          county: place.county,
          lat: place.lat,
          lng: place.lng,
          instructions,
          saveAddress,
        },
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSaved = (addr: SavedAddress) => {
    onChange({
      addressId: addr.id,
      address: undefined,
    });
  };

  const canProceed = !!(draft.addressId || selectedPlace);

  // Update address object when label/instructions/save changes
  useEffect(() => {
    if (selectedPlace) {
      onChange({
        address: {
          label,
          addressLine1: selectedPlace.formattedAddress,
          area: selectedPlace.area,
          city: selectedPlace.city,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          instructions,
          saveAddress,
        },
      });
    }
  }, [label, instructions, saveAddress, selectedPlace]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Where do you need us?</h1>
        <p className="text-gray-500 mt-1">Enter the address for this job</p>
      </div>

      {/* Saved / New tabs */}
      {savedAddresses.length > 0 && (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {(['saved', 'new'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); onChange({ addressId: undefined, address: undefined }); setSelectedPlace(null); setQuery(''); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'saved' ? `Saved addresses (${savedAddresses.length})` : 'New address'}
            </button>
          ))}
        </div>
      )}

      {/* Saved addresses list */}
      {mode === 'saved' && savedAddresses.length > 0 && (
        <div className="space-y-2">
          {savedAddresses.map((addr) => {
            const selected = draft.addressId === addr.id;
            return (
              <button
                key={addr.id}
                onClick={() => handleSelectSaved(addr)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  selected ? 'border-brand-600 bg-brand-50' : 'border-gray-200 bg-white hover:border-brand-200'
                }`}
              >
                <span className={`p-2.5 rounded-xl flex-shrink-0 ${selected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Home className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    {addr.label}
                    {addr.isDefault && <span className="badge bg-brand-50 text-brand-600 text-xs">Default</span>}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{addr.addressLine1}, {addr.area}</p>
                </div>
                {selected ? <CheckCircle className="h-5 w-5 text-brand-600 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-300" />}
              </button>
            );
          })}
          <button
            onClick={() => setMode('new')}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-all"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">Add a new address</span>
          </button>
        </div>
      )}

      {/* New address search */}
      {(mode === 'new' || savedAddresses.length === 0) && (
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search for your address or estate..."
              className="input pl-10 pr-10"
              autoComplete="off"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="card p-0 overflow-hidden divide-y divide-gray-100">
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                >
                  <MapPin className="h-4 w-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.mainText}</p>
                    <p className="text-xs text-gray-500">{s.secondaryText}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected place confirmation */}
          {selectedPlace && (
            <div className="card bg-teal-50 border border-teal-200 p-4">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-teal-800">{selectedPlace.formattedAddress}</p>
                  <p className="text-sm text-teal-600">{selectedPlace.area}, {selectedPlace.city}</p>
                </div>
              </div>
            </div>
          )}

          {/* Address details */}
          {selectedPlace && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Label this address</label>
                <div className="flex gap-2">
                  {['Home', 'Office', 'Other'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLabel(l)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        label === l ? 'border-brand-600 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                  {!['Home', 'Office', 'Other'].includes(label) && (
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="input flex-1 py-2"
                      placeholder="Custom label"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Access instructions <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Gate code 1234, 3rd floor, ring bell"
                  className="input"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">Save this address for future bookings</span>
              </label>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue → Pick date & time
      </button>
    </div>
  );
}
