'use client';
// Mama Fua — Cleaner Verification Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileImage, 
  Camera, 
  Eye, 
  Download, 
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  Ban,
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatKES } from '@mama-fua/shared';

interface VerificationApplication {
  id: string;
  cleanerId: string;
  cleaner: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    avatarUrl?: string;
  };
  idNumber: string;
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  blacklistCheck: {
    isBlacklisted: boolean;
    reason?: string;
    previousAccounts?: Array<{
      id: string;
      bannedAt: string;
      reason: string;
    }>;
  };
  aiAnalysis?: {
    faceMatch: number; // 0-100
    idQuality: number; // 0-100
    confidence: number; // 0-100
    flags: string[];
  };
}

interface CleanerVerificationProps {
  className?: string;
}

export function CleanerVerification({ className = '' }: CleanerVerificationProps) {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<VerificationApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['verification-applications', statusFilter, currentPage, searchQuery],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      const mockApplications: VerificationApplication[] = [
        {
          id: '1',
          cleanerId: 'c1',
          cleaner: {
            id: 'c1',
            firstName: 'Grace',
            lastName: 'Wanjiru',
            phone: '+254712345678',
            email: 'grace@example.com',
            avatarUrl: '/images/cleaner-1.jpg',
          },
          idNumber: '123456789',
          idFrontUrl: '/docs/id-front-1.jpg',
          idBackUrl: '/docs/id-back-1.jpg',
          selfieUrl: '/docs/selfie-1.jpg',
          status: 'PENDING',
          submittedAt: '2024-03-15T10:30:00Z',
          priority: 'HIGH',
          blacklistCheck: {
            isBlacklisted: false,
          },
          aiAnalysis: {
            faceMatch: 92,
            idQuality: 88,
            confidence: 90,
            flags: ['Slight glare on ID photo'],
          },
        },
        {
          id: '2',
          cleanerId: 'c2',
          cleaner: {
            id: 'c2',
            firstName: 'Mary',
            lastName: 'Njoroge',
            phone: '+254723456789',
            email: 'mary@example.com',
            avatarUrl: '/images/cleaner-2.jpg',
          },
          idNumber: '987654321',
          idFrontUrl: '/docs/id-front-2.jpg',
          idBackUrl: '/docs/id-back-2.jpg',
          selfieUrl: '/docs/selfie-2.jpg',
          status: 'UNDER_REVIEW',
          submittedAt: '2024-03-14T14:20:00Z',
          reviewedAt: '2024-03-15T09:15:00Z',
          reviewedBy: 'admin@system.com',
          priority: 'MEDIUM',
          blacklistCheck: {
            isBlacklisted: false,
          },
          aiAnalysis: {
            faceMatch: 85,
            idQuality: 92,
            confidence: 88,
            flags: [],
          },
        },
        {
          id: '3',
          cleanerId: 'c3',
          cleaner: {
            id: 'c3',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+254734567890',
            email: 'john@example.com',
            avatarUrl: '/images/cleaner-3.jpg',
          },
          idNumber: '456789123',
          idFrontUrl: '/docs/id-front-3.jpg',
          idBackUrl: '/docs/id-back-3.jpg',
          selfieUrl: '/docs/selfie-3.jpg',
          status: 'PENDING',
          submittedAt: '2024-03-13T16:45:00Z',
          priority: 'URGENT',
          blacklistCheck: {
            isBlacklisted: true,
            reason: 'Previously banned for fraudulent activity',
            previousAccounts: [
              {
                id: 'old-account-1',
                bannedAt: '2023-12-01T10:00:00Z',
                reason: 'Fraudulent ID submission',
              },
            ],
          },
          aiAnalysis: {
            faceMatch: 15,
            idQuality: 45,
            confidence: 20,
            flags: ['Face mismatch', 'Poor image quality', 'Possible fake ID'],
          },
        },
      ];

      let filtered = mockApplications;

      // Filter by status
      if (statusFilter !== 'all') {
        filtered = filtered.filter(app => app.status === statusFilter);
      }

      // Filter by search
      if (searchQuery) {
        filtered = filtered.filter(app => 
          app.cleaner.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.cleaner.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.cleaner.phone.includes(searchQuery) ||
          app.idNumber.includes(searchQuery)
        );
      }

      return {
        applications: filtered,
        totalCount: filtered.length,
        totalPages: Math.ceil(filtered.length / 10),
        currentPage: currentPage,
      };
    },
  });

  const approveVerification = useMutation({
    mutationFn: async (applicationId: string) => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-applications'] });
      setSelectedApplication(null);
    },
  });

  const rejectVerification = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-applications'] });
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedApplication(null);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-700';
      case 'VERIFIED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700';
      case 'HIGH':
        return 'bg-amber-100 text-amber-700';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700';
      case 'LOW':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const handleApprove = () => {
    if (selectedApplication) {
      approveVerification.mutate(selectedApplication.id);
    }
  };

  const handleReject = () => {
    if (selectedApplication && rejectionReason) {
      rejectVerification.mutate({
        applicationId: selectedApplication.id,
        reason: rejectionReason,
      });
    }
  };

  const openFullscreen = (imageUrl: string) => {
    setFullscreenImage(imageUrl);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setFullscreenImage(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Cleaner Verification</h2>
          <p className="text-ink-600">Review and approve cleaner verification applications</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {!selectedApplication && (
        <div className="rounded-xl border border-slate-200 bg-white">
          {applicationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applicationsData?.applications.map((application) => (
                <div
                  key={application.id}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedApplication(application)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden">
                        {application.cleaner.avatarUrl ? (
                          <img
                            src={application.cleaner.avatarUrl}
                            alt={`${application.cleaner.firstName} ${application.cleaner.lastName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-600">
                            <Users className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-ink-900">
                          {application.cleaner.firstName} {application.cleaner.lastName}
                        </h4>
                        <p className="text-sm text-ink-600">{application.cleaner.phone}</p>
                        <p className="text-xs text-ink-500">
                          Submitted {new Date(application.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(application.priority)}`}>
                        {application.priority}
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ')}
                      </div>
                      {application.blacklistCheck.isBlacklisted && (
                        <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                          BLACKLISTED
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Application Detail View */}
      {selectedApplication && (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedApplication(null)}
            className="btn-ghost px-4 py-2"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to List
          </button>

          {/* Application Details */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cleaner Info */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Cleaner Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-200 overflow-hidden">
                    {selectedApplication.cleaner.avatarUrl ? (
                      <img
                        src={selectedApplication.cleaner.avatarUrl}
                        alt={`${selectedApplication.cleaner.firstName} ${selectedApplication.cleaner.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <Users className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-ink-900">
                      {selectedApplication.cleaner.firstName} {selectedApplication.cleaner.lastName}
                    </h4>
                    <p className="text-ink-600">{selectedApplication.cleaner.phone}</p>
                    {selectedApplication.cleaner.email && (
                      <p className="text-sm text-ink-500">{selectedApplication.cleaner.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">ID Number:</span>
                    <span className="font-medium text-ink-900">{selectedApplication.idNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">Submitted:</span>
                    <span className="font-medium text-ink-900">
                      {new Date(selectedApplication.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">Priority:</span>
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(selectedApplication.priority)}`}>
                      {selectedApplication.priority}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Verification Status</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600">Current Status:</span>
                  <div className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                    {selectedApplication.status.replace('_', ' ')}
                  </div>
                </div>
                
                {selectedApplication.reviewedAt && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">Reviewed:</span>
                      <span className="font-medium text-ink-900">
                        {new Date(selectedApplication.reviewedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">Reviewed By:</span>
                      <span className="font-medium text-ink-900">{selectedApplication.reviewedBy}</span>
                    </div>
                  </div>
                )}

                {/* Blacklist Check */}
                <div className={`rounded-lg p-4 ${
                  selectedApplication.blacklistCheck.isBlacklisted 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {selectedApplication.blacklistCheck.isBlacklisted ? (
                      <Ban className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-semibold text-ink-900">Blacklist Check</h4>
                      <p className={`text-sm ${
                        selectedApplication.blacklistCheck.isBlacklisted ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {selectedApplication.blacklistCheck.isBlacklisted 
                          ? 'BLACKLISTED' 
                          : 'Clear'
                        }
                      </p>
                      {selectedApplication.blacklistCheck.reason && (
                        <p className="text-sm text-ink-600 mt-1">
                          {selectedApplication.blacklistCheck.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                {selectedApplication.aiAnalysis && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-ink-900">AI Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-ink-600">Face Match:</span>
                        <span className={`font-medium ${getQualityColor(selectedApplication.aiAnalysis.faceMatch)}`}>
                          {selectedApplication.aiAnalysis.faceMatch}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-ink-600">ID Quality:</span>
                        <span className={`font-medium ${getQualityColor(selectedApplication.aiAnalysis.idQuality)}`}>
                          {selectedApplication.aiAnalysis.idQuality}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-ink-600">Confidence:</span>
                        <span className={`font-medium ${getQualityColor(selectedApplication.aiAnalysis.confidence)}`}>
                          {selectedApplication.aiAnalysis.confidence}%
                        </span>
                      </div>
                    </div>
                    
                    {selectedApplication.aiAnalysis.flags.length > 0 && (
                      <div className="rounded-lg bg-amber-50 p-3">
                        <h5 className="font-semibold text-amber-900 mb-2">Flags:</h5>
                        <ul className="space-y-1 text-sm text-amber-700">
                          {selectedApplication.aiAnalysis.flags.map((flag, index) => (
                            <li key={index}>• {flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Review */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Document Review</h3>
            
            <div className="grid gap-6 md:grid-cols-3">
              {/* ID Front */}
              <div>
                <h4 className="font-medium text-ink-900 mb-2">ID Front</h4>
                <div className="relative group">
                  <img
                    src={selectedApplication.idFrontUrl}
                    alt="ID Front"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => openFullscreen(selectedApplication.idFrontUrl)}
                      className="btn-ghost p-2 text-white"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ID Back */}
              <div>
                <h4 className="font-medium text-ink-900 mb-2">ID Back</h4>
                <div className="relative group">
                  <img
                    src={selectedApplication.idBackUrl}
                    alt="ID Back"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => openFullscreen(selectedApplication.idBackUrl)}
                      className="btn-ghost p-2 text-white"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Selfie */}
              <div>
                <h4 className="font-medium text-ink-900 mb-2">Selfie</h4>
                <div className="relative group">
                  <img
                    src={selectedApplication.selfieUrl}
                    alt="Selfie"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => openFullscreen(selectedApplication.selfieUrl)}
                      className="btn-ghost p-2 text-white"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Actions</h3>
            
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={approveVerification.isPending || selectedApplication.status === 'VERIFIED'}
                className="btn-primary px-6 py-3"
              >
                {approveVerification.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Verification
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowRejectionModal(true)}
                disabled={selectedApplication.status === 'REJECTED'}
                className="btn-secondary px-6 py-3 text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Application
              </button>
            </div>

            {selectedApplication.blacklistCheck.isBlacklisted && (
              <div className="mt-4 rounded-lg bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Warning: This applicant is blacklisted</p>
                    <p>Previous accounts show fraudulent activity. Immediate rejection recommended.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 m-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink-900">Reject Application</h3>
              <button
                onClick={() => setShowRejectionModal(false)}
                className="btn-ghost p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Rejection Reason</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input"
                >
                  <option value="">Select a reason</option>
                  <option value="BLURRY_PHOTO">Blurry or low-quality photos</option>
                  <option value="ID_EXPIRED">ID card is expired</option>
                  <option value="FACE_MISMATCH">Face does not match ID photo</option>
                  <option value="BLACKLISTED">Applicant is blacklisted</option>
                  <option value="FAKE_ID">Fake or altered ID detected</option>
                  <option value="INCOMPLETE">Incomplete documentation</option>
                  <option value="OTHER">Other (specify in notes)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Additional Notes (Optional)</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Add any additional context..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="btn-ghost px-6 py-3"
              >
                Cancel
              </button>
              
              <button
                onClick={handleReject}
                disabled={!rejectionReason || rejectVerification.isPending}
                className="btn-secondary px-6 py-3 text-red-600"
              >
                {rejectVerification.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {isFullscreen && fullscreenImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 btn-ghost p-2 text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen view"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
