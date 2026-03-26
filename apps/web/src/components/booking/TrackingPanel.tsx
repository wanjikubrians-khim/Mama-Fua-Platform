'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowRight,
  Clock3,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Radio,
  Route,
  ShieldCheck,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type Role = 'CLIENT' | 'CLEANER' | 'ADMIN' | 'SUPER_ADMIN' | undefined;

interface TrackingPanelProps {
  bookingId: string;
  bookingStatus: string;
  role: Role;
  cleaner: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    phone: string;
  } | null;
  address: {
    addressLine1: string;
    area: string;
    lat: number;
    lng: number;
  };
}

interface TrackingSnapshot {
  bookingId: string;
  status: string;
  phase: 'MATCHING' | 'UNASSIGNED' | 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'IDLE';
  cleaner: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    phone: string;
    isAvailable: boolean;
  } | null;
  address: {
    lat: number;
    lng: number;
    addressLine1: string;
    area: string;
  };
  liveLocation: {
    lat: number;
    lng: number;
    updatedAt: string;
    source: 'live' | 'profile';
  } | null;
  distanceKm: number | null;
  etaMinutes: number | null;
}

type ShareState = 'idle' | 'starting' | 'sharing' | 'error';

const TRACKING_PHASE_STYLES: Record<TrackingSnapshot['phase'], string> = {
  MATCHING: 'bg-amber-100 text-amber-800',
  UNASSIGNED: 'bg-slate-100 text-slate-700',
  ASSIGNED: 'bg-brand-100 text-brand-800',
  EN_ROUTE: 'bg-teal-100 text-teal-800',
  ON_SITE: 'bg-mint-100 text-mint-800',
  COMPLETED: 'bg-mint-100 text-mint-800',
  IDLE: 'bg-slate-100 text-slate-700',
};

export default function TrackingPanel({
  bookingId,
  bookingStatus,
  role,
  cleaner,
  address,
}: TrackingPanelProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [tracking, setTracking] = useState<TrackingSnapshot | null>(null);
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [shareError, setShareError] = useState<string | null>(null);
  const [lastSharedAt, setLastSharedAt] = useState<string | null>(null);

  const isClient = role === 'CLIENT';
  const isCleaner = role === 'CLEANER';
  const canTrackLive = !!cleaner && ['ACCEPTED', 'PAID', 'IN_PROGRESS'].includes(bookingStatus);

  const { data, isLoading } = useQuery({
    queryKey: ['booking-tracking', bookingId],
    queryFn: async () => {
      const response = await bookingApi.tracking(bookingId);
      return response.data.data as TrackingSnapshot;
    },
    enabled: !!accessToken,
    refetchInterval: canTrackLive ? 30000 : false,
  });

  useEffect(() => {
    if (data) {
      setTracking(data);
      if (data.liveLocation?.updatedAt) {
        setLastSharedAt(data.liveLocation.updatedAt);
      }
    }
  }, [data]);

  useEffect(() => {
    if (!isClient || !accessToken || !canTrackLive) return;

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001',
      {
        auth: { token: accessToken },
        transports: ['websocket'],
      }
    );

    socket.on('connect', () => {
      socket.emit('booking:join', bookingId);
    });

    socket.on(
      'cleaner:location',
      (payload: { bookingId: string; lat: number; lng: number; accuracy?: number }) => {
        if (payload.bookingId !== bookingId) return;
        const updatedAt = new Date().toISOString();
        setLastSharedAt(updatedAt);
        setTracking((current) =>
          applyLiveLocation(
            current ??
              buildFallbackTracking({
                bookingId,
                bookingStatus,
                cleaner,
                address,
              }),
            payload.lat,
            payload.lng,
            updatedAt,
            bookingStatus
          )
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [
    accessToken,
    address.addressLine1,
    address.area,
    address.lat,
    address.lng,
    bookingId,
    bookingStatus,
    canTrackLive,
    cleaner?.avatarUrl,
    cleaner?.firstName,
    cleaner?.id,
    cleaner?.lastName,
    cleaner?.phone,
    isClient,
  ]);

  useEffect(() => {
    return () => {
      if (
        watchIdRef.current !== null &&
        typeof window !== 'undefined' &&
        'geolocation' in navigator
      ) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  function startSharing() {
    if (!isCleaner) return;

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setShareState('error');
      setShareError('Location access is not supported in this browser.');
      return;
    }

    if (!accessToken) {
      setShareState('error');
      setShareError('Sign in again to start sharing your location.');
      return;
    }

    stopSharing(false);
    setShareError(null);
    setShareState('starting');

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001',
      {
        auth: { token: accessToken },
        transports: ['websocket'],
      }
    );

    socket.on('connect', () => {
      setShareState('sharing');
    });

    socket.on('connect_error', () => {
      setShareState('error');
      setShareError('Could not connect to live tracking. Try again.');
    });

    socketRef.current = socket;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const updatedAt = new Date().toISOString();
        socket.emit('cleaner:position', {
          bookingId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLastSharedAt(updatedAt);
        setTracking((current) =>
          applyLiveLocation(
            current ??
              buildFallbackTracking({
                bookingId,
                bookingStatus,
                cleaner,
                address,
              }),
            position.coords.latitude,
            position.coords.longitude,
            updatedAt,
            bookingStatus
          )
        );
      },
      (error) => {
        stopSharing(false);
        setShareState('error');
        setShareError(getGeolocationError(error.code));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );
  }

  function stopSharing(clearError = true) {
    if (
      watchIdRef.current !== null &&
      typeof window !== 'undefined' &&
      'geolocation' in navigator
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setShareState('idle');
    if (clearError) setShareError(null);
  }

  const snapshot =
    tracking ??
    buildFallbackTracking({
      bookingId,
      bookingStatus,
      cleaner,
      address,
    });

  const phaseStyle = TRACKING_PHASE_STYLES[snapshot.phase];
  const phaseLabel = getPhaseLabel(snapshot.phase);
  const lastUpdateLabel = lastSharedAt
    ? `${formatDistanceToNow(new Date(lastSharedAt), { addSuffix: true })}`
    : null;

  return (
    <section className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/86 shadow-soft backdrop-blur">
      <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-6 py-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">
              {isCleaner ? 'Arrival broadcast' : 'Live cleaner tracking'}
            </p>
            <h2 className="mt-3 text-3xl">
              {isCleaner ? 'Share your route to the client' : 'Follow the cleaner in real time'}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/72">
              {isCleaner
                ? 'Broadcast your live position while you are on the way so the client can prepare for access and check-in.'
                : 'Route status updates automatically. Open chat or call if building access changes.'}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${phaseStyle}`}
          >
            <Radio className="h-3.5 w-3.5" />
            {phaseLabel}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricCard
            icon={<Clock3 className="h-4 w-4 text-brand-100" />}
            label="Last update"
            value={lastUpdateLabel ?? 'Waiting'}
            dark
          />
          <MetricCard
            icon={<Route className="h-4 w-4 text-teal-200" />}
            label="Distance"
            value={snapshot.distanceKm !== null ? `${snapshot.distanceKm.toFixed(1)} km` : '—'}
            dark
          />
          <MetricCard
            icon={<Navigation className="h-4 w-4 text-mint-200" />}
            label="ETA"
            value={snapshot.etaMinutes !== null ? `${snapshot.etaMinutes} min` : 'Pending'}
            dark
          />
        </div>
      </div>

      <div className="px-6 py-6">
        <RoutePreview tracking={snapshot} />

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard
            icon={<LocateFixed className="h-4 w-4 text-brand-600" />}
            label="Client location"
            value={snapshot.address.area}
          />
          <MetricCard
            icon={<MapPin className="h-4 w-4 text-brand-600" />}
            label="Address"
            value={snapshot.address.addressLine1}
          />
          <MetricCard
            icon={<ShieldCheck className="h-4 w-4 text-brand-600" />}
            label="Location source"
            value={
              snapshot.liveLocation?.source === 'live'
                ? 'Live socket'
                : snapshot.liveLocation
                  ? 'Last saved'
                  : 'Not shared yet'
            }
          />
        </div>

        {isCleaner && canTrackLive && (
          <div className="mt-5 rounded-[1.6rem] border border-teal-100 bg-teal-50/80 px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-teal-900">
                  {shareState === 'sharing'
                    ? 'Live sharing is active'
                    : 'Start sharing your live location'}
                </p>
                <p className="mt-2 text-sm leading-6 text-teal-800/80">
                  {shareState === 'sharing'
                    ? `Updates are being sent in the background${lastSharedAt ? `, last sent ${format(new Date(lastSharedAt), 'h:mm a')}.` : '.'}`
                    : 'Use this when you are on the way so the client gets an ETA and route updates.'}
                </p>
              </div>
              {shareState === 'sharing' ? (
                <button
                  onClick={() => stopSharing()}
                  className="rounded-2xl border border-teal-300 bg-white px-5 py-3 text-sm font-semibold text-teal-900 transition-colors hover:bg-teal-100"
                >
                  Stop sharing
                </button>
              ) : (
                <button
                  onClick={startSharing}
                  disabled={shareState === 'starting'}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {shareState === 'starting' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting
                    </>
                  ) : (
                    'Share live location'
                  )}
                </button>
              )}
            </div>
            {shareError && <p className="mt-3 text-sm text-red-600">{shareError}</p>}
          </div>
        )}

        {isClient && canTrackLive && !snapshot.liveLocation && !isLoading && (
          <div className="mt-5 rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            The cleaner is assigned, but live location has not been shared yet. You can still use
            chat or phone to coordinate arrival.
          </div>
        )}

        {isClient && canTrackLive && snapshot.liveLocation && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-[1.6rem] border border-brand-100 bg-brand-50/70 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-ink-900">Cleaner is on the way</p>
              <p className="mt-1 text-sm text-ink-500">
                {snapshot.distanceKm !== null
                  ? `${snapshot.distanceKm.toFixed(1)} km away with an estimated arrival in ${snapshot.etaMinutes ?? 'a few'} minutes.`
                  : 'Route updates are live now.'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 flex-shrink-0 text-brand-600" />
          </div>
        )}
      </div>
    </section>
  );
}

function RoutePreview({ tracking }: { tracking: TrackingSnapshot }) {
  const routePoints = getRoutePoints(tracking);

  return (
    <div className="relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(43,108,176,0.14),_transparent_46%),linear-gradient(180deg,#f8fbff_0%,#eef7ff_100%)] px-5 py-5">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="relative h-64 overflow-hidden rounded-[1.4rem] border border-white/70 bg-white/45 shadow-inner">
        <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-brand-200" />

        <div
          className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-brand-600 text-white shadow-card"
          style={{ left: `${routePoints.client.left}%`, top: `${routePoints.client.top}%` }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-6 w-6" />
          </div>
        </div>

        {tracking.liveLocation ? (
          <>
            <div
              className="absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300/20"
              style={{ left: `${routePoints.cleaner.left}%`, top: `${routePoints.cleaner.top}%` }}
            />
            <div
              className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-teal-600 text-white shadow-card"
              style={{ left: `${routePoints.cleaner.left}%`, top: `${routePoints.cleaner.top}%` }}
            >
              <div className="flex h-full w-full items-center justify-center">
                <Navigation className="h-6 w-6" />
              </div>
            </div>
            <svg className="absolute inset-0 h-full w-full">
              <line
                x1={`${routePoints.cleaner.left}%`}
                y1={`${routePoints.cleaner.top}%`}
                x2={`${routePoints.client.left}%`}
                y2={`${routePoints.client.top}%`}
                stroke="rgba(13,148,136,0.7)"
                strokeDasharray="8 8"
                strokeWidth="4"
              />
            </svg>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-ink-500 shadow-soft">
              Waiting for live cleaner location
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  dark = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border px-4 py-4 ${
        dark
          ? 'border-white/10 bg-white/10 text-white'
          : 'border-slate-200 bg-white text-ink-900 shadow-soft'
      }`}
    >
      <div className="flex items-center gap-2">{icon}</div>
      <p
        className={`mt-3 text-xs font-semibold uppercase tracking-[0.16em] ${dark ? 'text-white/60' : 'text-ink-400'}`}
      >
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}

function buildFallbackTracking({
  bookingId,
  bookingStatus,
  cleaner,
  address,
}: Pick<
  TrackingPanelProps,
  'bookingId' | 'bookingStatus' | 'cleaner' | 'address'
>): TrackingSnapshot {
  return {
    bookingId,
    status: bookingStatus,
    phase: getFallbackPhase(bookingStatus, !!cleaner),
    cleaner: cleaner
      ? {
          ...cleaner,
          isAvailable: true,
        }
      : null,
    address,
    liveLocation: null,
    distanceKm: null,
    etaMinutes: null,
  };
}

function applyLiveLocation(
  current: TrackingSnapshot,
  lat: number,
  lng: number,
  updatedAt: string,
  bookingStatus: string
): TrackingSnapshot {
  const distanceKm = haversineDistanceKm(lat, lng, current.address.lat, current.address.lng);
  return {
    ...current,
    phase: bookingStatus === 'IN_PROGRESS' ? 'ON_SITE' : 'EN_ROUTE',
    liveLocation: {
      lat,
      lng,
      updatedAt,
      source: 'live',
    },
    distanceKm,
    etaMinutes: bookingStatus === 'IN_PROGRESS' ? 0 : getEtaMinutes(distanceKm),
  };
}

function getRoutePoints(tracking: TrackingSnapshot) {
  const client = { left: 76, top: 64 };
  if (!tracking.liveLocation) {
    return {
      client,
      cleaner: { left: 28, top: 34 },
    };
  }

  const latDiff = tracking.liveLocation.lat - tracking.address.lat;
  const lngDiff = tracking.liveLocation.lng - tracking.address.lng;
  const span = Math.max(Math.abs(latDiff), Math.abs(lngDiff), 0.005);
  const cleanerLeft = clamp(50 + (lngDiff / span) * 28, 14, 86);
  const cleanerTop = clamp(50 - (latDiff / span) * 28, 14, 86);

  return {
    client,
    cleaner: { left: cleanerLeft, top: cleanerTop },
  };
}

function getPhaseLabel(phase: TrackingSnapshot['phase']) {
  switch (phase) {
    case 'MATCHING':
      return 'Matching';
    case 'UNASSIGNED':
      return 'Waiting';
    case 'ASSIGNED':
      return 'Assigned';
    case 'EN_ROUTE':
      return 'En route';
    case 'ON_SITE':
      return 'On site';
    case 'COMPLETED':
      return 'Completed';
    default:
      return 'Idle';
  }
}

function getFallbackPhase(status: string, hasCleaner: boolean): TrackingSnapshot['phase'] {
  if (status === 'PENDING' && !hasCleaner) return 'MATCHING';
  if (status === 'IN_PROGRESS') return 'ON_SITE';
  if (['COMPLETED', 'CONFIRMED'].includes(status)) return 'COMPLETED';
  if (['ACCEPTED', 'PAID'].includes(status)) return 'ASSIGNED';
  return hasCleaner ? 'ASSIGNED' : 'UNASSIGNED';
}

function getGeolocationError(code: number) {
  if (code === 1) return 'Allow location access to share your route.';
  if (code === 2) return 'Location could not be determined. Move to a clearer signal area.';
  if (code === 3) return 'Location request timed out. Try again.';
  return 'Location sharing failed. Try again.';
}

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getEtaMinutes(distanceKm: number) {
  return Math.max(4, Math.round((distanceKm / 24) * 60));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
