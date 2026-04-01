'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  MessageSquare,
  Loader2,
} from 'lucide-react';

interface Dispute {
  id: string;
  bookingRef: string;
  clientName: string;
  cleanerName: string | null;
  reason: string;
  description: string;
  status: string;
  severity: string;
  refundAmount: number;
  createdAt: string;
  resolutionTarget: string;
}

export default function DisputeManagement() {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  return (
    <div className="space-y-6">
      <div className="admin-card p-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <p className="admin-eyebrow">Disputes</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Resolution Dashboard</h2>
          </div>
        </div>

        {selectedDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-slate-900 p-6">
              <button
                onClick={() => {
                  setSelectedDispute(null);
                  setResolutionNotes('');
                }}
                className="btn-ghost p-2"
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
                      Severity
                    </label>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedDispute.severity}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Client
                    </label>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedDispute.clientName}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Refund Amount
                    </label>
                    <p className="mt-2 text-lg font-semibold text-white">
                      KES {selectedDispute.refundAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Description
                  </label>
                  <p className="mt-2 text-slate-300">{selectedDispute.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white">Resolution Notes</label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                    className="input mt-2 resize-none bg-white/5"
                    placeholder="Add resolution notes..."
                  />
                </div>

                <div className="flex gap-3">
                  <button className="btn-secondary flex-1">Reject Dispute</button>
                  <button className="btn-primary flex-1">Approve & Refund</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-slate-400">No disputes currently under review.</p>
        </div>
      </div>
    </div>
  );
}
