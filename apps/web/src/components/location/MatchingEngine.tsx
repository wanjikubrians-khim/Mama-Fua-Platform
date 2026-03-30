'use client';
// Mama Fua — Matching Engine UI Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  Star, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertTriangle,
  Timer
} from 'lucide-react';

interface CleanerCandidate {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  rating: number;
  distance: number;
  acceptanceRate: number;
  totalJobs: number;
  lastActiveAt: string;
  matchScore: number;
  isAvailable: boolean;
}

interface JobRequest {
  id: string;
  serviceType: string;
  address: string;
  lat: number;
  lng: number;
  scheduledTime: string;
  preferences?: {
    gender?: string;
    language?: string;
    minRating?: number;
  };
}

interface MatchingEngineProps {
  jobRequest: JobRequest;
  onMatchFound: (cleaner: CleanerCandidate) => void;
  onMatchFailed: () => void;
  onCancel: () => void;
  className?: string;
}

export function MatchingEngine({
  jobRequest,
  onMatchFound,
  onMatchFailed,
  onCancel,
  className = '',
}: MatchingEngineProps) {
  const [matchingStatus, setMatchingStatus] = useState<'searching' | 'found' | 'offered' | 'accepted' | 'failed' | 'timeout'>('searching');
  const [candidates, setCandidates] = useState<CleanerCandidate[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [selectedCandidate, setSelectedCandidate] = useState<CleanerCandidate | null>(null);

  // Simulate matching process
  useEffect(() => {
    const simulateMatching = async () => {
      setMatchingStatus('searching');
      
      // Simulate API call to find candidates
      setTimeout(() => {
        const mockCandidates: CleanerCandidate[] = [
          {
            id: '1',
            firstName: 'Grace',
            lastName: 'Wanjiru',
            avatarUrl: '/images/cleaner-1.jpg',
            rating: 4.8,
            distance: 1.2,
            acceptanceRate: 0.95,
            totalJobs: 156,
            lastActiveAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            matchScore: 92,
            isAvailable: true,
          },
          {
            id: '2',
            firstName: 'Mary',
            lastName: 'Njoroge',
            avatarUrl: '/images/cleaner-2.jpg',
            rating: 4.6,
            distance: 2.1,
            acceptanceRate: 0.88,
            totalJobs: 89,
            lastActiveAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            matchScore: 85,
            isAvailable: true,
          },
          {
            id: '3',
            firstName: 'Susan',
            lastName: 'Muriuki',
            avatarUrl: '/images/cleaner-3.jpg',
            rating: 4.9,
            distance: 3.5,
            acceptanceRate: 0.92,
            totalJobs: 234,
            lastActiveAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            matchScore: 78,
            isAvailable: true,
          },
        ];

        const sortedCandidates = [...mockCandidates].sort((a, b) => b.matchScore - a.matchScore);
        setCandidates(sortedCandidates);
        setMatchingStatus('found');
        
        // Auto-select top candidate after 2 seconds
        setTimeout(() => {
          const topCandidate = sortedCandidates[0] ?? null;
          if (!topCandidate) {
            setMatchingStatus('failed');
            onMatchFailed();
            return;
          }

          setSelectedCandidate(topCandidate);
          setTimeRemaining(300);
          setMatchingStatus('offered');
        }, 2000);
      }, 1500);
    };

    simulateMatching();
  }, [jobRequest, onMatchFailed]);

  // Countdown timer for response
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const startCountdown = () => {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleTimeout = () => {
      const nextCandidate = candidates[currentAttempt + 1] ?? null;

      if (nextCandidate) {
        // Try next candidate
        setCurrentAttempt(prev => prev + 1);
        setSelectedCandidate(nextCandidate);
        setTimeRemaining(300);
      } else {
        // All candidates exhausted
        setMatchingStatus('timeout');
        onMatchFailed();
      }
    };

    if (matchingStatus === 'offered') {
      startCountdown();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchingStatus, currentAttempt, candidates, onMatchFailed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (matchingStatus) {
      case 'searching':
        return 'text-blue-600 bg-blue-50';
      case 'found':
        return 'text-green-600 bg-green-50';
      case 'offered':
        return 'text-amber-600 bg-amber-50';
      case 'accepted':
        return 'text-mint-600 bg-mint-50';
      case 'failed':
      case 'timeout':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = () => {
    switch (matchingStatus) {
      case 'searching':
        return <Search className="h-5 w-5 animate-pulse" />;
      case 'found':
        return <Users className="h-5 w-5" />;
      case 'offered':
        return <Clock className="h-5 w-5" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5" />;
      case 'failed':
      case 'timeout':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Search className="h-5 w-5" />;
    }
  };

  const getStatusText = () => {
    switch (matchingStatus) {
      case 'searching':
        return 'Finding available cleaners...';
      case 'found':
        return `${candidates.length} cleaners found`;
      case 'offered':
        return `Offer sent to ${selectedCandidate?.firstName} ${selectedCandidate?.lastName}`;
      case 'accepted':
        return `${selectedCandidate?.firstName} accepted!`;
      case 'failed':
        return 'No cleaners available';
      case 'timeout':
        return 'All cleaners busy';
      default:
        return 'Initializing...';
    }
  };

  const calculateMatchScoreBreakdown = (candidate: CleanerCandidate) => {
    const distanceScore = Math.max(0, (10 - candidate.distance) / 10) * 100;
    const ratingScore = (candidate.rating / 5.0) * 100;
    const acceptanceScore = candidate.acceptanceRate * 100;
    const jobScore = Math.min(100, Math.log10(candidate.totalJobs + 1) * 50);
    const activityBonus = Date.now() - new Date(candidate.lastActiveAt).getTime() < 2 * 60 * 60 * 1000 ? 100 : 0;

    return {
      distance: Math.round(distanceScore * 0.4),
      rating: Math.round(ratingScore * 0.3),
      acceptance: Math.round(acceptanceScore * 0.2),
      experience: Math.round(jobScore * 0.05),
      activity: Math.round(activityBonus * 0.05),
      total: candidate.matchScore,
    };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Header */}
      <div className={`rounded-xl border p-6 ${getStatusColor()}`}>
        <div className="flex items-center gap-4">
          {getStatusIcon()}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink-900">{getStatusText()}</h3>
            {matchingStatus === 'offered' && (
              <p className="text-sm opacity-75">
                Waiting for response... {formatTime(timeRemaining)} remaining
              </p>
            )}
            {matchingStatus === 'found' && (
              <p className="text-sm opacity-75">
                Selecting the best match for your job
              </p>
            )}
          </div>
          
          {/* Progress indicator */}
          {matchingStatus === 'searching' && (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}
          
          {/* Cancel button */}
          {(matchingStatus === 'searching' || matchingStatus === 'found') && (
            <button
              onClick={onCancel}
              className="btn-ghost px-4 py-2 text-red-600 hover:bg-red-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Candidates List */}
      {(matchingStatus === 'found' || matchingStatus === 'offered' || matchingStatus === 'accepted') && (
        <div className="space-y-4">
          <h4 className="font-semibold text-ink-900">Available Cleaners</h4>
          
          {candidates.map((candidate, index) => {
            const isSelected = selectedCandidate?.id === candidate.id;
            const scoreBreakdown = calculateMatchScoreBreakdown(candidate);
            
            return (
              <div
                key={candidate.id}
                className={`rounded-xl border-2 p-4 transition-all ${
                  isSelected 
                    ? 'border-brand-500 bg-brand-50' 
                    : index === currentAttempt 
                      ? 'border-amber-300 bg-amber-50' 
                      : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Cleaner Info */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                      {candidate.avatarUrl ? (
                        <img 
                          src={candidate.avatarUrl} 
                          alt={`${candidate.firstName} ${candidate.lastName}`}
                          className="h-full w-full rounded-full object-cover" 
                        />
                      ) : (
                        `${candidate.firstName[0]}${candidate.lastName[0]}`
                      )}
                    </div>
                    <div>
                      <h5 className="font-semibold text-ink-900">
                        {candidate.firstName} {candidate.lastName}
                      </h5>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current text-amber-500" />
                          <span className="text-ink-600">{candidate.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-ink-600">
                          <MapPin className="h-3 w-3" />
                          {candidate.distance.toFixed(1)}km
                        </div>
                        <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          candidate.isAvailable 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {candidate.isAvailable ? 'Available' : 'Busy'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="flex-1 text-right">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">Match Score</span>
                      <span className="text-lg font-bold text-slate-900">{candidate.matchScore}</span>
                    </div>
                    
                    {/* Score breakdown tooltip */}
                    <div className="mt-2 text-xs text-slate-600">
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span>Distance:</span>
                          <span className="font-medium">{scoreBreakdown.distance}pts</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Rating:</span>
                          <span className="font-medium">{scoreBreakdown.rating}pts</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Acceptance:</span>
                          <span className="font-medium">{scoreBreakdown.acceptance}pts</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Experience:</span>
                          <span className="font-medium">{scoreBreakdown.experience}pts</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>Activity:</span>
                          <span className="font-medium">{scoreBreakdown.activity}pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="mt-3 flex items-center gap-2">
                  {isSelected && matchingStatus === 'offered' && (
                    <>
                      <Timer className="h-4 w-4 text-amber-600 animate-pulse" />
                      <span className="text-sm text-amber-700">Waiting for response...</span>
                    </>
                  )}
                  
                  {isSelected && matchingStatus === 'accepted' && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Accepted!</span>
                    </>
                  )}
                  
                  {index === currentAttempt && matchingStatus === 'offered' && (
                    <span className="text-xs text-ink-500">
                      Attempt {currentAttempt + 1} of {candidates.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Failed/Timeout */}
      {(matchingStatus === 'failed' || matchingStatus === 'timeout') && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            {matchingStatus === 'timeout' ? 'No Cleaners Available' : 'Matching Failed'}
          </h3>
          <p className="text-red-700 mb-6">
            {matchingStatus === 'timeout' 
              ? 'All available cleaners are currently busy or have declined the job. You can try again in a few minutes or browse cleaners manually.'
              : 'We couldn\'t find any available cleaners for your requested service and location.'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary px-6 py-3"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                // Navigate to browse cleaners
                window.location.href = '/cleaners/browse';
              }}
              className="btn-secondary px-6 py-3"
            >
              Browse Cleaners
            </button>
          </div>
        </div>
      )}

      {/* Job Details Summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="font-semibold text-ink-900 mb-3">Job Details</h4>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <span className="text-ink-600">Service:</span>
            <span className="font-medium text-ink-900">{jobRequest.serviceType}</span>
          </div>
          <div>
            <span className="text-ink-600">Location:</span>
            <span className="font-medium text-ink-900">{jobRequest.address}</span>
          </div>
          <div>
            <span className="text-ink-600">Time:</span>
            <span className="font-medium text-ink-900">
              {new Date(jobRequest.scheduledTime).toLocaleString()}
            </span>
          </div>
          {jobRequest.preferences && (
            <div>
              <span className="text-ink-600">Preferences:</span>
              <span className="font-medium text-ink-900">
                {[
                  jobRequest.preferences.gender && `Gender: ${jobRequest.preferences.gender}`,
                  jobRequest.preferences.language && `Language: ${jobRequest.preferences.language}`,
                  jobRequest.preferences.minRating && `Min Rating: ${jobRequest.preferences.minRating}+`,
                ].filter(Boolean).join(', ') || 'None'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
