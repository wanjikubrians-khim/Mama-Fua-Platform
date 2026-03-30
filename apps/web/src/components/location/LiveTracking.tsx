'use client';
// Mama Fua — Live Location Tracking Component
// KhimTech | 2026

import { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Navigation, Phone, MessageCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface CleanerPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface Booking {
  id: string;
  status: string;
  cleanerId: string;
  startTime: string;
  estimatedArrival?: string;
  address: string;
  clientName: string;
}

interface LiveTrackingProps {
  booking: Booking;
  socket: Socket;
  className?: string;
  height?: string;
}

declare global {
  interface Window {
    google: any;
    initTrackingMap?: () => void;
  }
}

export function LiveTracking({ 
  booking, 
  socket, 
  className = '', 
  height = '400px' 
}: LiveTrackingProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const cleanerMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  
  const [cleanerPosition, setCleanerPosition] = useState<CleanerPosition | null>(null);
  const [eta, setEta] = useState<string>('');
  const [trackingStatus, setTrackingStatus] = useState<'connecting' | 'tracking' | 'error'>('connecting');
  const [connectionError, setConnectionError] = useState<string>('');
  const [isArrived, setIsArrived] = useState(false);

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!window.google || !mapRef.current) return;

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: -1.2921, lng: 36.8219 }, // Nairobi default
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // Add destination marker
        if (booking.address) {
          // Geocode the address to get coordinates
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: booking.address }, (results: any[], status: string) => {
            if (status === 'OK' && results[0]) {
              const location = results[0].geometry.location;
              
              destinationMarkerRef.current = new window.google.maps.Marker({
                position: location,
                map: map,
                icon: {
                  url: '/images/destination-marker.png',
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(20, 20),
                },
                title: 'Destination',
              });

              map.setCenter(location);
            }
          });
        }

      } catch (error) {
        console.error('Map initialization error:', error);
        setTrackingStatus('error');
        setConnectionError('Failed to load map');
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initTrackingMap`;
      script.async = true;
      script.defer = true;
      
      window.initTrackingMap = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (window.initTrackingMap) {
        delete window.initTrackingMap;
      }
    };
  }, [booking.address]);

  // Setup socket connection for live tracking
  useEffect(() => {
    if (!socket || !booking.id) return;

    setTrackingStatus('connecting');

    // Join booking room for tracking
    socket.emit('join:booking', { bookingId: booking.id });

    // Listen for cleaner position updates
    const handleCleanerPosition = (data: CleanerPosition) => {
      setCleanerPosition(data);
      setTrackingStatus('tracking');
      
      // Update cleaner marker on map
      updateCleanerMarker(data);
      
      // Calculate ETA if we have both positions
      if (destinationMarkerRef.current) {
        calculateETA(data);
      }
    };

    // Listen for booking status changes
    const handleBookingUpdate = (data: any) => {
      if (data.status === 'IN_PROGRESS') {
        setIsArrived(false);
      } else if (data.status === 'COMPLETED') {
        setIsArrived(true);
        setTrackingStatus('error'); // Stop tracking when completed
        setConnectionError('Service completed successfully');
      }
    };

    // Listen for connection errors
    const handleConnectError = (error: any) => {
      console.error('Socket connection error:', error);
      setTrackingStatus('error');
      setConnectionError('Connection lost. Trying to reconnect...');
    };

    socket.on('cleaner:position', handleCleanerPosition);
    socket.on('booking:update', handleBookingUpdate);
    socket.on('connect_error', handleConnectError);

    // Cleanup
    return () => {
      socket.off('cleaner:position', handleCleanerPosition);
      socket.off('booking:update', handleBookingUpdate);
      socket.off('connect_error', handleConnectError);
      socket.emit('leave:booking', { bookingId: booking.id });
    };
  }, [socket, booking.id]);

  // Update cleaner marker position
  const updateCleanerMarker = (position: CleanerPosition) => {
    if (!mapInstanceRef.current || !window.google) return;

    const latLng = new window.google.maps.LatLng(position.lat, position.lng);

    if (!cleanerMarkerRef.current) {
      // Create marker if it doesn't exist
      cleanerMarkerRef.current = new window.google.maps.Marker({
        position: latLng,
        map: mapInstanceRef.current,
        icon: {
          url: '/images/cleaner-marker.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20),
        },
        title: 'Cleaner',
        animation: window.google.maps.Animation.DROP,
      });
    } else {
      // Update existing marker position
      cleanerMarkerRef.current.setPosition(latLng);
    }

    // Draw route from cleaner to destination
    updateRoute(position);
  };

  // Update route polyline
  const updateRoute = (position: CleanerPosition) => {
    if (!mapInstanceRef.current || !destinationMarkerRef.current || !cleanerMarkerRef.current) return;

    // Remove existing route
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
    }

    // Create new route
    const route = [
      cleanerMarkerRef.current.getPosition(),
      destinationMarkerRef.current.getPosition()
    ];

    routePolylineRef.current = new window.google.maps.Polyline({
      path: route,
      geodesic: true,
      strokeColor: '#3B82F6',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map: mapInstanceRef.current,
    });
  };

  // Calculate ETA using Distance Matrix API
  const calculateETA = async (position: CleanerPosition) => {
    try {
      const response = await fetch(
        `/api/v1/location/distance?from_lat=${position.lat}&from_lng=${position.lng}&to_lat=${destinationMarkerRef.current?.getPosition()?.lat()}&to_lng=${destinationMarkerRef.current?.getPosition()?.lng()}`
      );
      const data = await response.json();
      
      if (data.success && data.duration) {
        const arrivalTime = new Date(Date.now() + data.duration.value * 1000);
        setEta(arrivalTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      }
    } catch (error) {
      console.error('ETA calculation error:', error);
    }
  };

  const getStatusColor = () => {
    switch (trackingStatus) {
      case 'connecting':
        return 'text-amber-600 bg-amber-50';
      case 'tracking':
        return 'text-green-600 bg-green-50';
      case 'error':
        return isArrived ? 'text-mint-600 bg-mint-50' : 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = () => {
    switch (trackingStatus) {
      case 'connecting':
        return <Clock className="h-5 w-5" />;
      case 'tracking':
        return <Navigation className="h-5 w-5" />;
      case 'error':
        return isArrived ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />;
      default:
        return <Navigation className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    switch (trackingStatus) {
      case 'connecting':
        return 'Connecting to tracking service...';
      case 'tracking':
        return `Cleaner is ${eta ? `${eta} away` : 'on the way'}`;
      case 'error':
        return isArrived ? 'Cleaner has arrived!' : connectionError || 'Tracking unavailable';
      default:
        return 'Initializing tracking...';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tracking Status Bar */}
      <div className={`rounded-xl border p-4 ${getStatusColor()}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="font-semibold text-ink-900">{getStatusText()}</p>
            {eta && trackingStatus === 'tracking' && (
              <p className="text-sm opacity-75">Estimated arrival: {eta}</p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <button className="btn-ghost p-2" title="Call cleaner">
              <Phone className="h-4 w-4" />
            </button>
            <button className="btn-ghost p-2" title="Message cleaner">
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Map */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200" style={{ height }}>
        {trackingStatus === 'connecting' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <Clock className="mx-auto h-8 w-8 animate-pulse text-amber-600 mb-3" />
              <p className="text-sm font-medium text-ink-900">Establishing connection...</p>
            </div>
          </div>
        )}
        
        {trackingStatus === 'error' && !isArrived && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-red-600 mb-3" />
              <p className="text-red-900 font-medium">{connectionError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}
        
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Map overlay info */}
        {cleanerPosition && trackingStatus === 'tracking' && (
          <div className="absolute top-4 right-4 rounded-lg bg-white p-3 shadow-lg">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-ink-900">Live Tracking</span>
              </div>
              <div className="text-xs text-ink-600">
                Last update: {new Date(cleanerPosition.timestamp).toLocaleTimeString()}
              </div>
              <div className="text-xs text-ink-600">
                Accuracy: ±{cleanerPosition.accuracy}m
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-ink-900 mb-3">Booking Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-600">Status:</span>
            <span className="font-medium text-ink-900 capitalize">{booking.status.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-600">Client:</span>
            <span className="font-medium text-ink-900">{booking.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-600">Address:</span>
            <span className="font-medium text-ink-900 text-right max-w-xs">{booking.address}</span>
          </div>
          {booking.startTime && (
            <div className="flex justify-between">
              <span className="text-ink-600">Start Time:</span>
              <span className="font-medium text-ink-900">
                {new Date(booking.startTime).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
