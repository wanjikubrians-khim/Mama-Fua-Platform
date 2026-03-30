'use client';
// Mama Fua — Dispute Management Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  DollarSign, 
  MessageSquare, 
  FileText, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Calendar,
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Scale,
  Gavel,
  Shield,
  AlertCircle
} from 'lucide-react';
import { formatKES } from '@mama-fua/shared';

interface Dispute {
  id: string;
  bookingId: string;
  booking: {
    id: string;
    bookingRef: string;
    serviceType: string;
    scheduledTime: string;
    totalAmount: number;
    status: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  cleaner: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  reportedBy: 'CLIENT' | 'CLEANER';
  category: 'SERVICE_QUALITY' | 'DAMAGE' | 'THEFT' | 'SAFETY' | 'PAYMENT' | 'NO_SHOW' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_CLIENT' | 'RESOLVED_CLEANER' | 'ESCALATED';
  resolution?: {
    type: 'REFUND' | 'PARTIAL_REFUND' | 'COMPENSATION' | 'APOLOGY' | 'OTHER';
    amount?: number;
    description: string;
    resolvedAt: string;
    resolvedBy: string;
  };
  evidence: Array<{
    type: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'MESSAGE';
    url: string;
    description: string;
    uploadedAt: string;
  }>;
  messages: Array<{
    id: string;
    senderId: string;
    senderType: 'CLIENT' | 'CLEANER' | 'ADMIN';
    message: string;
    createdAt: string;
    isAdmin: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedResolutionTime?: string;
}

interface DisputeManagementProps {
  className?: string;
}

export function DisputeManagement({ className = '' }: DisputeManagementProps) {
  const queryClient = useQueryClient();
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_CLIENT' | 'RESOLVED_CLEANER' | 'ESCALATED'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionType, setResolutionType] = useState<'REFUND' | 'PARTIAL_REFUND' | 'COMPENSATION' | 'APOLOGY' | 'OTHER'>('REFUND');
  const [resolutionAmount, setResolutionAmount] = useState<number>(0);
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');

  const { data: disputesData, isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes', statusFilter, severityFilter, currentPage, searchQuery],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      const mockDisputes: Dispute[] = [
        {
          id: '1',
          bookingId: 'b1',
          booking: {
            id: 'b1',
            bookingRef: 'BK001',
            serviceType: 'Home Cleaning',
            scheduledTime: '2024-03-15T10:00:00Z',
            totalAmount: 120000, // KES 1,200.00
            status: 'COMPLETED',
          },
          client: {
            id: 'c1',
            firstName: 'Alice',
            lastName: 'Johnson',
            phone: '+254712345678',
            email: 'alice@example.com',
          },
          cleaner: {
            id: 'cl1',
            firstName: 'Grace',
            lastName: 'Wanjiru',
            phone: '+254723456789',
            email: 'grace@example.com',
          },
          reportedBy: 'CLIENT',
          category: 'SERVICE_QUALITY',
          severity: 'MEDIUM',
          description: 'Cleaner did not complete the full scope of work. Kitchen and bathrooms were not properly cleaned.',
          status: 'OPEN',
          evidence: [
            {
              type: 'PHOTO',
              url: '/evidence/dirty-kitchen.jpg',
              description: 'Dirty kitchen after cleaning',
              uploadedAt: '2024-03-15T14:30:00Z',
            },
            {
              type: 'PHOTO',
              url: '/evidence/dirty-bathroom.jpg',
              description: 'Dirty bathroom after cleaning',
              uploadedAt: '2024-03-15T14:31:00Z',
            },
          ],
          messages: [
            {
              id: 'm1',
              senderId: 'c1',
              senderType: 'CLIENT',
              message: 'I paid for full house cleaning but the kitchen and bathrooms were not cleaned properly.',
              createdAt: '2024-03-15T14:25:00Z',
              isAdmin: false,
            },
            {
              id: 'm2',
              senderId: 'cl1',
              senderType: 'CLEANER',
              message: 'I did clean the kitchen and bathrooms. The client is being unreasonable.',
              createdAt: '2024-03-15T14:45:00Z',
              isAdmin: false,
            },
          ],
          createdAt: '2024-03-15T14:20:00Z',
          updatedAt: '2024-03-15T14:45:00Z',
          priority: 'MEDIUM',
          estimatedResolutionTime: '2024-03-17T10:00:00Z',
        },
        {
          id: '2',
          bookingId: 'b2',
          booking: {
            id: 'b2',
            bookingRef: 'BK002',
            serviceType: 'Deep Cleaning',
            scheduledTime: '2024-03-14T09:00:00Z',
            totalAmount: 350000, // KES 3,500.00
            status: 'COMPLETED',
          },
          client: {
            id: 'c2',
            firstName: 'Bob',
            lastName: 'Smith',
            phone: '+254734567890',
            email: 'bob@example.com',
          },
          cleaner: {
            id: 'cl2',
            firstName: 'Mary',
            lastName: 'Njoroge',
            phone: '+254745678901',
            email: 'mary@example.com',
          },
          reportedBy: 'CLEANER',
          category: 'DAMAGE',
          severity: 'HIGH',
          description: 'Client broke expensive vase during cleaning and refused to pay for it.',
          status: 'UNDER_REVIEW',
          evidence: [
            {
              type: 'PHOTO',
              url: '/evidence/broken-vase.jpg',
              description: 'Broken vase before cleaning',
              uploadedAt: '2024-03-14T15:30:00Z',
            },
            {
              type: 'DOCUMENT',
              url: '/evidence/vase-receipt.pdf',
              description: 'Original purchase receipt for vase (KES 8,000)',
              uploadedAt: '2024-03-14T15:31:00Z',
            },
          ],
          messages: [
            {
              id: 'm3',
              senderId: 'cl2',
              senderType: 'CLEANER',
              message: 'The client broke my expensive vase and is refusing to compensate me for the damage.',
              createdAt: '2024-03-14T15:25:00Z',
              isAdmin: false,
            },
            {
              id: 'm4',
              senderId: 'c2',
              senderType: 'CLIENT',
              message: 'The vase was already broken when I arrived. The cleaner is trying to scam me.',
              createdAt: '2024-03-14T15:35:00Z',
              isAdmin: false,
            },
          ],
          createdAt: '2024-03-14T15:20:00Z',
          updatedAt: '2024-03-14T15:35:00Z',
          priority: 'HIGH',
          assignedTo: 'admin@system.com',
          estimatedResolutionTime: '2024-03-16T17:00:00Z',
        },
        {
          id: '3',
          bookingId: 'b3',
          booking: {
            id: 'b3',
            bookingRef: 'BK003',
            serviceType: 'Office Cleaning',
            scheduledTime: '2024-03-13T08:00:00Z',
            totalAmount: 200000, // KES 2,000.00
            status: 'CANCELLED',
          },
          client: {
            id: 'c3',
            firstName: 'Carol',
            lastName: 'Davis',
            phone: '+254756789012',
            email: 'carol@example.com',
          },
          cleaner: {
            id: 'cl3',
            firstName: 'Susan',
            lastName: 'Muriuki',
            phone: '+254767890123',
            email: 'susan@example.com',
          },
          reportedBy: 'CLEANER',
          category: 'NO_SHOW',
          severity: 'CRITICAL',
          description: 'Client cancelled booking 30 minutes before scheduled time without notice. Cleaner was already on the way.',
          status: 'RESOLVED_CLEANER',
          resolution: {
            type: 'COMPENSATION',
            amount: 50000, // KES 500.00
            description: 'Client compensated cleaner for travel time and inconvenience.',
            resolvedAt: '2024-03-13T16:30:00Z',
            resolvedBy: 'admin@system.com',
          },
          evidence: [],
          messages: [
            {
              id: 'm5',
              senderId: 'cl3',
              senderType: 'CLEANER',
              message: 'Client cancelled last minute after I was already on the way. I should be compensated for my time.',
              createdAt: '2024-03-13T08:45:00Z',
              isAdmin: false,
            },
          ],
          createdAt: '2024-03-13T08:40:00Z',
          updatedAt: '2024-03-13T16:30:00Z',
          priority: 'URGENT',
        },
      ];

      let filtered = mockDisputes;

      // Filter by status
      if (statusFilter !== 'all') {
        filtered = filtered.filter(dispute => dispute.status === statusFilter);
      }

      // Filter by severity
      if (severityFilter !== 'all') {
        filtered = filtered.filter(dispute => dispute.severity === severityFilter);
      }

      // Filter by search
      if (searchQuery) {
        filtered = filtered.filter(dispute => 
          dispute.booking.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dispute.client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dispute.client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dispute.cleaner.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dispute.cleaner.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dispute.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return {
        disputes: filtered,
        totalCount: filtered.length,
        totalPages: Math.ceil(filtered.length / 10),
        currentPage: currentPage,
      };
    },
  });

  const resolveDispute = useMutation({
    mutationFn: async (data: {
      disputeId: string;
      type: string;
      amount?: number;
      description: string;
    }) => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setShowResolutionModal(false);
      setResolutionType('REFUND');
      setResolutionAmount(0);
      setResolutionDescription('');
      setSelectedDispute(null);
    },
  });

  const escalateDispute = useMutation({
    mutationFn: async (data: {
      disputeId: string;
      reason: string;
    }) => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setShowEscalateModal(false);
      setEscalationReason('');
      setSelectedDispute(null);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-700';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-700';
      case 'RESOLVED_CLIENT':
        return 'bg-green-100 text-green-700';
      case 'RESOLVED_CLEANER':
        return 'bg-green-100 text-green-700';
      case 'ESCALATED':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'bg-green-100 text-green-700';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700';
      case 'CRITICAL':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SERVICE_QUALITY':
        return <AlertTriangle className="h-4 w-4" />;
      case 'DAMAGE':
        return <AlertCircle className="h-4 w-4" />;
      case 'THEFT':
        return <Shield className="h-4 w-4" />;
      case 'SAFETY':
        return <AlertTriangle className="h-4 w-4" />;
      case 'PAYMENT':
        return <DollarSign className="h-4 w-4" />;
      case 'NO_SHOW':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleResolve = () => {
    if (selectedDispute && resolutionDescription) {
      resolveDispute.mutate({
        disputeId: selectedDispute.id,
        type: resolutionType,
        amount: resolutionAmount,
        description: resolutionDescription,
      });
    }
  };

  const handleEscalate = () => {
    if (selectedDispute && escalationReason) {
      escalateDispute.mutate({
        disputeId: selectedDispute.id,
        reason: escalationReason,
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">Dispute Management</h2>
          <p className="text-ink-600">Review and resolve booking disputes</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search disputes..."
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
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED_CLIENT">Resolved (Client)</option>
            <option value="RESOLVED_CLEANER">Resolved (Cleaner)</option>
            <option value="ESCALATED">Escalated</option>
          </select>
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="input"
          >
            <option value="all">All Severity</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Disputes List */}
      {!selectedDispute && (
        <div className="rounded-xl border border-slate-200 bg-white">
          {disputesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {disputesData?.disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-ink-900">{dispute.booking.bookingRef}</span>
                        <div className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(dispute.status)}`}>
                          {dispute.status.replace('_', ' ')}
                        </div>
                        <div className={`rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(dispute.severity)}`}>
                          {dispute.severity}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-ink-600 mb-2">
                        {getCategoryIcon(dispute.category)}
                        <span>{dispute.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Reported by {dispute.reportedBy}</span>
                        <span>•</span>
                        <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="text-sm text-ink-700 line-clamp-2 mb-2">{dispute.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-ink-500">
                        <span>Client: {dispute.client.firstName} {dispute.client.lastName}</span>
                        <span>Cleaner: {dispute.cleaner.firstName} {dispute.cleaner.lastName}</span>
                        <span>Amount: {formatKES(dispute.booking.totalAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {dispute.evidence.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-ink-500">
                          <FileText className="h-3 w-3" />
                          <span>{dispute.evidence.length} evidence</span>
                        </div>
                      )}
                      
                      {dispute.messages.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-ink-500">
                          <MessageSquare className="h-3 w-3" />
                          <span>{dispute.messages.length} messages</span>
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

      {/* Dispute Detail View */}
      {selectedDispute && (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedDispute(null)}
            className="btn-ghost px-4 py-2"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to List
          </button>

          {/* Dispute Header */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-ink-900 mb-2">
                  Dispute: {selectedDispute.booking.bookingRef}
                </h3>
                <div className="flex items-center gap-3">
                  <div className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(selectedDispute.status)}`}>
                    {selectedDispute.status.replace('_', ' ')}
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-medium ${getSeverityColor(selectedDispute.severity)}`}>
                    {selectedDispute.severity}
                  </div>
                  <div className="rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700">
                    {selectedDispute.category.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-ink-600">Booking Amount</p>
                <p className="text-lg font-bold text-ink-900">{formatKES(selectedDispute.booking.totalAmount)}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-ink-900 mb-2">Client</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-ink-700">{selectedDispute.client.firstName} {selectedDispute.client.lastName}</p>
                  <p className="text-ink-600">{selectedDispute.client.phone}</p>
                  {selectedDispute.client.email && (
                    <p className="text-ink-500">{selectedDispute.client.email}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-ink-900 mb-2">Cleaner</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-ink-700">{selectedDispute.cleaner.firstName} {selectedDispute.cleaner.lastName}</p>
                  <p className="text-ink-600">{selectedDispute.cleaner.phone}</p>
                  {selectedDispute.cleaner.email && (
                    <p className="text-ink-500">{selectedDispute.cleaner.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-ink-900 mb-2">Description</h4>
              <p className="text-ink-700">{selectedDispute.description}</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-ink-600">Reported By</p>
                <p className="font-medium text-ink-900">{selectedDispute.reportedBy}</p>
              </div>
              <div>
                <p className="text-sm text-ink-600">Created</p>
                <p className="font-medium text-ink-900">
                  {new Date(selectedDispute.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedDispute.estimatedResolutionTime && (
                <div>
                  <p className="text-sm text-ink-600">Est. Resolution</p>
                  <p className="font-medium text-ink-900">
                    {new Date(selectedDispute.estimatedResolutionTime).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Evidence */}
          {selectedDispute.evidence.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Evidence</h3>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {selectedDispute.evidence.map((evidence, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-ink-600" />
                      <span className="text-sm font-medium text-ink-900">{evidence.type}</span>
                    </div>
                    <p className="text-sm text-ink-600 mb-2">{evidence.description}</p>
                    <div className="flex gap-2">
                      <button className="btn-ghost px-3 py-1 text-xs">
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </button>
                      <button className="btn-ghost px-3 py-1 text-xs">
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Messages</h3>
            
            <div className="space-y-4">
              {selectedDispute.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`max-w-md rounded-lg p-3 ${
                    message.senderType === 'ADMIN'
                      ? 'bg-brand-100 text-brand-900'
                      : message.senderType === 'CLIENT'
                      ? 'bg-blue-50 text-blue-900'
                      : 'bg-green-50 text-green-900'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.senderType === 'ADMIN'
                          ? 'Admin'
                          : message.senderType === 'CLIENT'
                          ? `${selectedDispute.client.firstName} ${selectedDispute.client.lastName}`
                          : `${selectedDispute.cleaner.firstName} ${selectedDispute.cleaner.lastName}`}
                      </span>
                      <span className="text-xs opacity-75">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution */}
          {selectedDispute.resolution ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Resolution</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Type:</span>
                  <span className="font-medium text-green-900">{selectedDispute.resolution.type}</span>
                </div>
                
                {selectedDispute.resolution.amount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Amount:</span>
                    <span className="font-medium text-green-900">{formatKES(selectedDispute.resolution.amount)}</span>
                  </div>
                )}
                
                <div>
                  <span className="text-sm text-green-700">Description:</span>
                  <p className="font-medium text-green-900 mt-1">{selectedDispute.resolution.description}</p>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Resolved:</span>
                  <span className="font-medium text-green-900">
                    {new Date(selectedDispute.resolution.resolvedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-green-700">Resolved By:</span>
                  <span className="font-medium text-green-900">{selectedDispute.resolution.resolvedBy}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Actions</h3>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResolutionModal(true)}
                  disabled={selectedDispute.status !== 'OPEN' && selectedDispute.status !== 'UNDER_REVIEW'}
                  className="btn-primary px-6 py-3"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve Dispute
                </button>
                
                <button
                  onClick={() => setShowEscalateModal(true)}
                  disabled={selectedDispute.status === 'ESCALATED'}
                  className="btn-secondary px-6 py-3"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Escalate
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 m-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink-900">Resolve Dispute</h3>
              <button
                onClick={() => setShowResolutionModal(false)}
                className="btn-ghost p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Resolution Type</label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value as any)}
                  className="input"
                >
                  <option value="REFUND">Full Refund</option>
                  <option value="PARTIAL_REFUND">Partial Refund</option>
                  <option value="COMPENSATION">Compensation</option>
                  <option value="APOLOGY">Apology</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {(resolutionType === 'REFUND' || resolutionType === 'PARTIAL_REFUND' || resolutionType === 'COMPENSATION') && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">Amount (KES)</label>
                  <input
                    type="number"
                    value={resolutionAmount}
                    onChange={(e) => setResolutionAmount(Number(e.target.value))}
                    className="input"
                    placeholder="Enter amount"
                    max={selectedDispute?.booking.totalAmount ? selectedDispute.booking.totalAmount / 100 : undefined}
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Description</label>
                <textarea
                  value={resolutionDescription}
                  onChange={(e) => setResolutionDescription(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Describe the resolution..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResolutionModal(false)}
                className="btn-ghost px-6 py-3"
              >
                Cancel
              </button>
              
              <button
                onClick={handleResolve}
                disabled={!resolutionDescription || resolveDispute.isPending}
                className="btn-primary px-6 py-3"
              >
                {resolveDispute.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve Dispute
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 m-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink-900">Escalate Dispute</h3>
              <button
                onClick={() => setShowEscalateModal(false)}
                className="btn-ghost p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Escalation Reason</label>
                <textarea
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Reason for escalation..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="btn-ghost px-6 py-3"
              >
                Cancel
              </button>
              
              <button
                onClick={handleEscalate}
                disabled={!escalationReason || escalateDispute.isPending}
                className="btn-secondary px-6 py-3"
              >
                {escalateDispute.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Escalating...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Escalate Dispute
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
