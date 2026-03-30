'use client';
// Mama Fua — Cleaner Map Component
// KhimTech | 2026

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Navigation, Star, Phone, MessageCircle } from 'lucide-react';

interface Cleaner {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  rating: number;
  totalReviews: number;
  distance: number;
  services: Array<{
    name: string;
    customPrice: number;
  }>;
  verificationStatus: string;
  isAvailable: boolean;
  nextAvailable?: string;
  bio: string;
}

interface CleanerMapProps {
  cleaners: Cleaner[];
  centerLat: number;
  centerLng: number;
  onCleanerSelect: (cleaner: Cleaner) => void;
  selectedCleaner?: Cleaner;
  className?: string;
  height?: string;
}

declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

export function CleanerMap({
  cleaners,
  centerLat,
  centerLng,
  onCleanerSelect,
  selectedCleaner,
  className = '',
  height = '400px',
}: CleanerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize Google Map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!window.google || !mapRef.current) return;

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 13,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;
        setIsMapLoading(false);

        // Add custom marker clusterer styling
        const markerClusterer = new window.google.maps.MarkerClusterer(map, [], {
          imagePath: '/images/marker-clusterer/',
          gridSize: 60,
          minimumClusterSize: 2,
        });

      } catch (error) {
        console.error('Map initialization error:', error);
        setMapError('Failed to load map. Please refresh the page.');
        setIsMapLoading(false);
      }
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      // Cleanup
      if (window.initMap) {
        delete window.initMap;
      }
    };
  }, [centerLat, centerLng]);

  // Update markers when cleaners change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each cleaner
    cleaners.forEach((cleaner) => {
      const marker = new window.google.maps.Marker({
        position: { lat: cleaner.distance, lng: cleaner.distance }, // This should be actual lat/lng from cleaner data
        map: mapInstanceRef.current,
        title: `${cleaner.firstName} ${cleaner.lastName}`,
        icon: {
          url: cleaner.avatarUrl || '/images/default-cleaner-avatar.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
        },
        animation: window.google.maps.Animation.DROP,
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(cleaner),
      });

      // Add click listener
      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        onCleanerSelect(cleaner);
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (cleaners.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      cleaners.forEach((cleaner) => {
        bounds.extend({ lat: cleaner.distance, lng: cleaner.distance }); // Should be actual lat/lng
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [cleaners, onCleanerSelect]);

  // Highlight selected cleaner
  useEffect(() => {
    if (!selectedCleaner || !markersRef.current.length) return;

    // Find and highlight the selected cleaner's marker
    const selectedMarker = markersRef.current.find((marker) => 
      marker.getTitle() === `${selectedCleaner.firstName} ${selectedCleaner.lastName}`
    );

    if (selectedMarker) {
      // Reset all markers to normal state
      markersRef.current.forEach((marker) => {
        marker.setIcon({
          url: marker.getIcon().url,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
        });
      });

      // Highlight selected marker
      selectedMarker.setIcon({
        url: selectedMarker.getIcon().url,
        scaledSize: new window.google.maps.Size(50, 50),
        anchor: new window.google.maps.Point(25, 25),
      });

      // Center map on selected cleaner
      mapInstanceRef.current?.panTo({
        lat: selectedCleaner.distance, // Should be actual lat/lng
        lng: selectedCleaner.distance,
      });
    }
  }, [selectedCleaner]);

  const createInfoWindowContent = (cleaner: Cleaner) => {
    return `
      <div class="p-4 max-w-xs">
        <div class="flex items-center gap-3 mb-3">
          <img src="${cleaner.avatarUrl || '/images/default-cleaner-avatar.png'}" 
               alt="${cleaner.firstName}" 
               class="w-12 h-12 rounded-full object-cover" />
          <div>
            <h3 class="font-semibold text-ink-900">${cleaner.firstName} ${cleaner.lastName}</h3>
            <div class="flex items-center gap-1">
              <span class="text-amber-500">★</span>
              <span class="text-sm text-ink-600">${cleaner.rating.toFixed(1)}</span>
              <span class="text-xs text-ink-500">(${cleaner.totalReviews})</span>
            </div>
          </div>
        </div>
        
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            ${cleaner.verificationStatus === 'VERIFIED' ? 
              '<span class="inline-flex items-center gap-1 rounded-full bg-mint-100 px-2 py-1 text-xs font-medium text-mint-700"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00016zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 01-1.414 0l-2 2a1 1 0 001.414 1.414L8.586 11l2.293 2.293a1 1 0 001.414-1.414z" clip-rule="evenodd"></path></svg>Verified</span>' : 
              '<span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">Not Verified</span>'
            }
            ${cleaner.isAvailable ? 
              '<span class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Available</span>' : 
              '<span class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Busy</span>'
            }
          </div>
          
          ${cleaner.services.length > 0 ? `
            <div class="border-t pt-2">
              <p class="text-sm font-medium text-ink-700 mb-1">Services:</p>
              <div class="space-y-1">
                ${cleaner.services.slice(0, 3).map(service => 
                  `<div class="flex justify-between text-sm">
                    <span class="text-ink-600">${service.name}</span>
                    <span class="font-medium text-ink-900">KES ${service.customPrice}</span>
                  </div>`
                ).join('')}
                ${cleaner.services.length > 3 ? '<p class="text-xs text-ink-500">+ more services</p>' : ''}
              </div>
            </div>
          ` : ''}
          
          <div class="flex gap-2 pt-2 border-t">
            <button onclick="window.parent.selectCleaner('${cleaner.id}')" 
                    class="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-700">
              View Profile
            </button>
            <button onclick="window.parent.contactCleaner('${cleaner.id}')" 
                    class="rounded-lg border border-brand-600 px-3 py-2 text-center text-sm font-medium text-brand-600 hover:bg-brand-50">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  };

  if (mapError) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-red-200 bg-red-50 ${className}`} style={{ height }}>
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-red-400 mb-3" />
          <p className="text-red-900 font-medium">{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 ${className}`} style={{ height }}>
      {isMapLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600 mb-3" />
            <p className="text-sm font-medium text-ink-900">Loading map...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-white p-3 shadow-lg">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-brand-600"></div>
            <span className="text-ink-700">Available Cleaners</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-slate-400"></div>
            <span className="text-ink-700">Busy Cleaners</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500"></div>
            <span className="text-ink-700">Selected Cleaner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
