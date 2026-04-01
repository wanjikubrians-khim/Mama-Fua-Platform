'use client';
// Mama Fua — Dispute Management Component
// KhimTech | 2026

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Users, 
  DollarSign, 
  Search,
  Eye,
  Loader2,
  X
} from 'lucide-react';
import { formatKES } from '@mama-fua/shared';
import { format } from 'date-fns';

interface Dispute {
  id: string;
  bookingRef: string;
  clientName: string;
  cleanerName: string | null;
  reason: string;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  refundAmount: number;
  createdAt: string;
  resolutionTarget: string;
}

export default function DisputeManagement() {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Mock API call
  const { data: disputesData, isLoading: disputesLoading } = useQuery({
    queryKey: ['disputes', statusFilter, severityFilter, searchQuery],
    queryFn: async () => {
      // Mock data
      const mockDisputes: Dispute[] = [
        {
          id: '1',
          bookingRef: 'BK001',
          clientName: 'John Kamau',
          cleanerName: 'Grace Wanjiru',
          reason: 'Service Quality',
          description: 'Client claims cleaner did not complete deep cleaning as agreed.',
          status: 'OPEN',
          severity: 'MEDIUM',
          refundAmount: 50000,
          createdAt: '2024-03-15T10:30:00Z',
          resolutionTarget: '2024-03-18T10:30:00Z',
        },
        {
          id: '2',
          bookingRef: 'BK002',
          clientName: 'Mary Njoroge',
          cleanerName: 'Samuel Kariuki',
          reason: 'Late Arrival',
          description: 'Cleaner arrived 2 hours late without communication.',
          status: 'INVESTIGATING',
          severity: 'HIGH',
          refundAmount: 75000,
          createdAt: '2024-03-14T14:20:00Z',
          resolutionTarget: '2024-03-17T14:20:00Z',
        },
      ];

      // Apply filters
      let filtered = mockDisputes;
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(d => d.status === statusFilter);
      }
      
      if (severityFilter !== 'all') {
        filtered = filtered.filter(d => d.severity === severityFilter);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(d => 
          d.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.cleanerName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return {
        disputes: filtered,
        totalCount: filtered.length,
        totalPages: Math.ceil(filtered.length / 10),
        currentPage: 1,
      };
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-amber-100 text-amber-700';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-700';
      case 'RESOLVED': return 'bg-green-100 text-green-700';
      case 'CLOSED': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-green-100 text-green-700';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="admin-card p-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <p className="admin-eyebrow">Disputes</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Resolution Dashboard</h2>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Disputes List */}
        {disputesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {disputesData?.disputes.map((dispute) => (
              <div key={dispute.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`rounded-lg p-2 ${getSeverityColor(dispute.severity)}`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{dispute.bookingRef}</span>
                        <div className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(dispute.status)}`}>
                          {dispute.status}
                        </div>
                        <div className={`rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(dispute.severity)}`}>
                          {dispute.severity}
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-700 mb-2">{dispute.reason}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{dispute.clientName}</span>
                        </div>
                        
                        {dispute.cleanerName && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{dispute.cleanerName}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatKES(dispute.refundAmount)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span>{format(new Date(dispute.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedDispute(dispute)}
                    className="btn-ghost p-2"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl rounded-lg bg-slate-900 p-6">
            <button
              onClick={() => setSelectedDispute(null)}
              className="btn-ghost p-2 absolute right-4 top-4"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mt-4 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Booking Ref
                  </label>
                  <p className="mt-2 text-lg font-semibold text-white">{selectedDispute.bookingRef}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Status
                  </label>
                  <div className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(selectedDispute.status)}`}>
                    {selectedDispute.status}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Severity
                  </label>
                  <div className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${getSeverityColor(selectedDispute.severity)}`}>
                    {selectedDispute.severity}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Refund Amount
                  </label>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatKES(selectedDispute.refundAmount)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Client
                  </label>
                  <p className="mt-2 text-lg font-semibold text-white">{selectedDispute.clientName}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Cleaner
                  </label>
                  <p className="mt-2 text-lg font-semibold text-white">{selectedDispute.cleanerName || 'Not assigned'}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Description
                </label>
                <p className="mt-2 text-slate-300">{selectedDispute.description}</p>
              </div>

              <div className="flex gap-3">
                <button className="btn-secondary flex-1">Reject Dispute</button>
                <button className="btn-primary flex-1">Approve & Refund</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
