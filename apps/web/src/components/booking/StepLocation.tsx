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
  const [mode, setMode] = useState<'saved' | 'new'>('saved');
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

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value.length < 3) {
        setSuggestions([]);
        return;
      }

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
    },
    [sessionToken]
  );

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

  const handleSelectSaved = (address: SavedAddress) => {
    onChange({
      addressId: address.id,
      address: undefined,
    });
  };

  const resetForMode = (nextMode: 'saved' | 'new') => {
    setMode(nextMode);
    onChange({ addressId: undefined, address: undefined });
    setSelectedPlace(null);
    setQuery('');
  };

  const canProceed = !!(draft.addressId || selectedPlace);

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
  }, [instructions, label, onChange, saveAddress, selectedPlace]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className="pill">Step 2</span>
        <div>
          <h1 className="text-4xl text-ink-900">Where do you need us?</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Choose a saved address or add a fresh one for this visit.
          </p>
        </div>
      </div>

      {savedAddresses.length > 0 && (
        <div className="rounded-[1.5rem] border border-white/90 bg-white/74 p-1 shadow-soft backdrop-blur">
          <div className="grid gap-1 sm:grid-cols-2">
            {(['saved', 'new'] as const).map((item) => (
              <button
                key={item}
                onClick={() => resetForMode(item)}
                className={`rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition-all ${
                  mode === item
                    ? 'bg-gradient-to-r from-brand-50 to-mint-50 text-ink-900 shadow-soft'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {item === 'saved' ? `Saved addresses (${savedAddresses.length})` : 'New address'}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'saved' && savedAddresses.length > 0 && (
        <div className="space-y-3">
          {savedAddresses.map((address) => {
            const selected = draft.addressId === address.id;

            return (
              <button
                key={address.id}
                onClick={() => handleSelectSaved(address)}
                className={`flex w-full items-center gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-200 ${
                  selected
                    ? 'border-brand-200 bg-gradient-to-br from-white via-brand-50 to-mint-50 shadow-card'
                    : 'border-white/90 bg-white/84 shadow-soft hover:-translate-y-0.5 hover:border-brand-100'
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    selected ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'
                  }`}
                >
                  <Home className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-ink-900">
                    {address.label}
                    {address.isDefault && (
                      <span className="badge bg-brand-100 text-brand-800">Default</span>
                    )}
                  </p>
                  <p className="truncate text-sm text-ink-500">
                    {address.addressLine1}, {address.area}
                  </p>
                </div>
                {selected ? (
                  <CheckCircle className="h-5 w-5 text-brand-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-ink-300" />
                )}
              </button>
            );
          })}

          <button
            onClick={() => setMode('new')}
            className="flex w-full items-center gap-3 rounded-[1.5rem] border border-dashed border-brand-200 bg-white/70 px-4 py-4 text-sm font-semibold text-brand-700 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-50"
          >
            <Plus className="h-5 w-5" />
            Add a new address
          </button>
        </div>
      )}

      {(mode === 'new' || savedAddresses.length === 0) && (
        <div className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search for your address or estate..."
              className="input pl-11 pr-11"
              autoComplete="off"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-400" />
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="overflow-hidden rounded-[1.6rem] border border-white/90 bg-white/86 shadow-card backdrop-blur">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.placeId}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-brand-50 ${
                    index !== suggestions.length - 1 ? 'border-b border-brand-50' : ''
                  }`}
                >
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{suggestion.mainText}</p>
                    <p className="text-xs text-ink-500">{suggestion.secondaryText}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedPlace && (
            <div className="card-muted shine-panel p-4">
              <div className="flex gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-mint-700" />
                <div>
                  <p className="font-semibold text-ink-900">{selectedPlace.formattedAddress}</p>
                  <p className="text-sm text-ink-500">
                    {selectedPlace.area}, {selectedPlace.city}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedPlace && (
            <div className="space-y-4 rounded-[1.75rem] border border-white/90 bg-white/70 p-5 shadow-soft backdrop-blur">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">
                  Label this address
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Home', 'Office', 'Other'].map((item) => (
                    <button
                      key={item}
                      onClick={() => setLabel(item)}
                      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                        label === item
                          ? 'border-brand-200 bg-brand-50 text-brand-800 shadow-soft'
                          : 'border-white/90 bg-white/80 text-ink-600 shadow-soft hover:border-brand-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                  {!['Home', 'Office', 'Other'].includes(label) && (
                    <input
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                      className="input min-w-[11rem] flex-1 py-2"
                      placeholder="Custom label"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">
                  Access instructions <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="e.g. Gate code 1234, 3rd floor, ring bell"
                  className="input"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                  className="h-4 w-4 rounded border-brand-200 text-brand-600 focus:ring-brand-400"
                />
                Save this address for future bookings
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
        Continue to date & time
      </button>
    </div>
  );
}
