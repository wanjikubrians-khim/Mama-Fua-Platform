'use client';
// Mama Fua — Payout Management Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Wallet, 
  ArrowUpRight, 
  Download, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Filter,
  TrendingUp,
  Users,
  BanknoteIcon,
  Timer,
  CheckCheck,
  AlertCircle,
  Info,
  Loader2,
  Plus,
  Smartphone
} from 'lucide-react';
import { formatKES } from '@mama-fua/shared';

const payoutRequestSchema = z.object({
  amount: z.number().min(1000, 'Minimum payout is KES 1,000').max(500000, 'Maximum payout is KES 500,000'),
  method: z.enum(['MPESA', 'BANK_TRANSFER']),
  bankDetails: z.object({
    bankName: z.string().min(1, 'Bank name is required'),
    accountName: z.string().min(1, 'Account name is required'),
    accountNumber: z.string().min(8, 'Account number must be at least 8 digits'),
    bankCode: z.string().length(3, 'Bank code must be 3 digits'),
  }).optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

type PayoutRequestData = z.infer<typeof payoutRequestSchema>;

interface PayoutRequest {
  id: string;
  amount: number;
  method: 'MPESA' | 'BANK_TRANSFER';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  processedAt?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankCode: string;
  };
  notes?: string;
  failureReason?: string;
  transactionId?: string;
  mpesaReceipt?: string;
}

interface PayoutStats {
  totalEarned: number;
  totalPaidOut: number;
  pendingPayouts: number;
  availableBalance: number;
  thisMonthEarned: number;
  lastPayoutDate?: string;
}

interface PayoutManagementProps {
  className?: string;
}

export function PayoutManagement({ className = '' }: PayoutManagementProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'history'>('overview');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['payout-stats'],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      return {
        totalEarned: 125000, // KES 1,250.00
        totalPaidOut: 100000, // KES 1,000.00
        pendingPayouts: 5000, // KES 50.00
        availableBalance: 20000, // KES 200.00
        thisMonthEarned: 15000, // KES 150.00
        lastPayoutDate: '2024-03-10T14:30:00Z',
      };
    },
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['payout-requests', filter],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      const mockRequests: PayoutRequest[] = [
        {
          id: '1',
          amount: 5000,
          method: 'MPESA',
          status: 'COMPLETED',
          requestedAt: '2024-03-10T10:30:00Z',
          processedAt: '2024-03-10T14:30:00Z',
          transactionId: 'MP789012',
          mpesaReceipt: 'OEI2AB3C4D5E6F7',
        },
        {
          id: '2',
          amount: 8000,
          method: 'BANK_TRANSFER',
          status: 'PENDING',
          requestedAt: '2024-03-12T09:15:00Z',
          bankDetails: {
            bankName: 'Equity Bank',
            accountName: 'John Doe',
            accountNumber: '1234567890123',
            bankCode: '070',
          },
        },
        {
          id: '3',
          amount: 3000,
          method: 'MPESA',
          status: 'FAILED',
          requestedAt: '2024-03-08T16:45:00Z',
          failureReason: 'Insufficient balance',
        },
      ];

      if (filter === 'pending') {
        return mockRequests.filter(r => r.status === 'PENDING');
      } else if (filter === 'completed') {
        return mockRequests.filter(r => r.status === 'COMPLETED');
      }
      
      return mockRequests;
    },
  });

  const requestPayout = useMutation({
    mutationFn: async (data: PayoutRequestData) => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, requestId: `PO${Date.now()}` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payout-requests'] });
      setShowRequestModal(false);
    },
  });

  const form = useForm<PayoutRequestData>({
    resolver: zodResolver(payoutRequestSchema),
    defaultValues: {
      amount: 5000, // KES 50.00
      method: 'MPESA',
      bankDetails: {
        bankName: '',
        accountName: '',
        accountNumber: '',
        bankCode: '',
      },
      notes: '',
    },
  });

  const selectedMethod = form.watch('method');

  const handleSubmit = (data: PayoutRequestData) => {
    if (data.method === 'BANK_TRANSFER' && (!data.bankDetails?.bankName || !data.bankDetails?.accountName || !data.bankDetails?.accountNumber || !data.bankDetails?.bankCode)) {
      return;
    }
    requestPayout.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-amber-600 bg-amber-50';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50';
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'FAILED':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'MPESA':
        return <Smartphone className="h-5 w-5 text-green-600" />;
      case 'BANK_TRANSFER':
        return <BanknoteIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <Wallet className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-green-100 p-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-ink-900">Total Earned</h4>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatKES(statsData?.totalEarned || 0)}
              </p>
              <p className="text-xs text-ink-500">All time</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-red-100 p-2">
                  <ArrowUpRight className="h-5 w-5 text-red-600" />
                </div>
                <h4 className="font-semibold text-ink-900">Total Paid Out</h4>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatKES(statsData?.totalPaidOut || 0)}
              </p>
              <p className="text-xs text-ink-500">All time</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-ink-900">Available Balance</h4>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {formatKES(statsData?.availableBalance || 0)}
              </p>
              <p className="text-xs text-ink-500">Ready for payout</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-amber-100 p-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <h4 className="font-semibold text-ink-900">Pending Payouts</h4>
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {formatKES(statsData?.pendingPayouts || 0)}
              </p>
              <p className="text-xs text-ink-500">Awaiting processing</p>
            </div>
          </div>

          {/* Request Button */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-ink-900 mb-4">Request Payout</h3>
              <p className="text-ink-600 mb-6">
                Request payout of your available balance. Processing takes 1-3 business days.
              </p>
              
              <button
                onClick={() => setShowRequestModal(true)}
                disabled={(statsData?.availableBalance || 0) < 1000}
                className="btn-primary px-8 py-3"
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Request Payout
              </button>
              
              {(statsData?.availableBalance || 0) < 1000 && (
                <p className="mt-3 text-sm text-amber-600">
                  Minimum payout amount is KES 1,000
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-ink-900">Payout Requests</h3>
            
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-ink-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border-0 text-sm font-medium text-ink-700 focus:ring-0"
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending Only</option>
                  <option value="completed">Completed Only</option>
                </select>
              </div>

              <button
                onClick={() => setShowRequestModal(true)}
                className="btn-primary px-4 py-2 text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </button>
            </div>
          </div>

          {/* Requests List */}
          <div className="rounded-xl border border-slate-200 bg-white">
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requestsData?.map((request) => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-ink-900">{formatKES(request.amount)}</h4>
                            <div className="flex items-center gap-2">
                              {getMethodIcon(request.method)}
                              <span className="text-sm text-ink-600">{request.method.replace('_', ' ')}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-ink-600">
                            Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                          
                          {request.processedAt && (
                            <p className="text-sm text-ink-600">
                              Processed: {new Date(request.processedAt).toLocaleDateString()}
                            </p>
                          )}
                          
                          {request.bankDetails && (
                            <div className="text-xs text-ink-500 mt-1">
                              <p>Bank: {request.bankDetails.bankName}</p>
                              <p>Account: {request.bankDetails.accountName}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    {/* Failure Reason */}
                    {request.status === 'FAILED' && request.failureReason && (
                      <div className="mt-3 rounded-lg bg-red-50 p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="text-sm text-red-700">
                            <p className="font-medium">Failure Reason:</p>
                            <p>{request.failureReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transaction Details */}
                    {request.status === 'COMPLETED' && (
                      <div className="mt-3 rounded-lg bg-green-50 p-3">
                        <div className="text-sm text-green-700">
                          <p className="font-medium">Transaction Details:</p>
                          {request.transactionId && <p>Transaction ID: {request.transactionId}</p>}
                          {request.mpesaReceipt && <p>M-Pesa Receipt: {request.mpesaReceipt}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink-900">Request Payout</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="btn-ghost p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Amount (KES)</label>
                <input
                  {...form.register('amount')}
                  type="number"
                  className="input"
                  placeholder="Enter amount to withdraw"
                  min={1000}
                  max={statsData?.availableBalance || 0}
                  step={100}
                />
                {form.formState.errors.amount && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.amount.message}</p>
                )}
                <p className="mt-1 text-xs text-ink-500">
                  Available: {formatKES(statsData?.availableBalance || 0)}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Payout Method</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-transparent p-4 transition-colors hover:border-slate-300 peer-checked:border-brand-600 peer-checked:bg-brand-50">
                    <input
                      {...form.register('method')}
                      type="radio"
                      value="MPESA"
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-ink-900">M-Pesa</p>
                        <p className="text-sm text-ink-600">1-3 business days</p>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-transparent p-4 transition-colors hover:border-slate-300 peer-checked:border-brand-600 peer-checked:bg-brand-50">
                    <input
                      {...form.register('method')}
                      type="radio"
                      value="BANK_TRANSFER"
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <BanknoteIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-ink-900">Bank Transfer</p>
                        <p className="text-sm text-ink-600">3-5 business days</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bank Details (shown when bank transfer is selected) */}
              {selectedMethod === 'BANK_TRANSFER' && (
                <div className="space-y-4 rounded-lg bg-slate-50 p-4">
                  <h4 className="font-semibold text-ink-900 mb-3">Bank Account Details</h4>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">Bank Name</label>
                      <input
                        {...form.register('bankDetails.bankName')}
                        type="text"
                        className="input"
                        placeholder="e.g., Equity Bank"
                      />
                      {form.formState.errors.bankDetails?.bankName && (
                        <p className="mt-1 text-xs text-red-500">{form.formState.errors.bankDetails.bankName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">Account Name</label>
                      <input
                        {...form.register('bankDetails.accountName')}
                        type="text"
                        className="input"
                        placeholder="Account holder name"
                      />
                      {form.formState.errors.bankDetails?.accountName && (
                        <p className="mt-1 text-xs text-red-500">{form.formState.errors.bankDetails.accountName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">Account Number</label>
                      <input
                        {...form.register('bankDetails.accountNumber')}
                        type="text"
                        className="input"
                        placeholder="1234567890123"
                        maxLength={20}
                      />
                      {form.formState.errors.bankDetails?.accountNumber && (
                        <p className="mt-1 text-xs text-red-500">{form.formState.errors.bankDetails.accountNumber.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">Bank Code</label>
                      <input
                        {...form.register('bankDetails.bankCode')}
                        type="text"
                        className="input"
                        placeholder="070"
                        maxLength={3}
                      />
                      {form.formState.errors.bankDetails?.bankCode && (
                        <p className="mt-1 text-xs text-red-500">{form.formState.errors.bankDetails.bankCode.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Notes (Optional)</label>
                <textarea
                  {...form.register('notes')}
                  className="input resize-none"
                  rows={3}
                  placeholder="Any additional information..."
                />
                {form.formState.errors.notes && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.notes.message}</p>
                )}
              </div>

              {/* Info Notice */}
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Payout Information:</p>
                    <ul className="mt-2 space-y-1 text-blue-600">
                      <li>• M-Pesa payouts: 1-3 business days</li>
                      <li>• Bank transfers: 3-5 business days</li>
                      <li>• Minimum payout: KES 1,000</li>
                      <li>• Maximum payout: KES 500,000 per transaction</li>
                      <li>• Processing fees may apply</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn-ghost px-6 py-3"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={requestPayout.isPending}
                  className="btn-primary px-6 py-3"
                >
                  {requestPayout.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex justify-center space-x-8 border-b border-slate-200">
        {[
          { key: 'overview', label: 'Overview', icon: TrendingUp },
          { key: 'requests', label: 'Requests', icon: Users },
          { key: 'history', label: 'History', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-4 px-1 text-sm font-medium transition-colors border-b-2 border-transparent ${
              activeTab === tab.key 
                ? 'text-brand-700 border-brand-600' 
                : 'text-ink-600 border-transparent hover:text-ink-900 hover:border-slate-300'
            }`}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
