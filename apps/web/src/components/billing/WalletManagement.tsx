'use client';
// Mama Fua — Wallet Management Component
// KhimTech | 2026

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  Download, 
  History, 
  CreditCard, 
  Smartphone, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Calendar,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { formatKES } from '@mama-fua/shared';

const topupSchema = z.object({
  amount: z.number().min(500, 'Minimum top-up is KES 500').max(50000, 'Maximum top-up is KES 50,000'),
  method: z.enum(['MPESA', 'STRIPE_CARD']),
  saveCard: z.boolean().default(false),
});

type TopupFormData = z.infer<typeof topupSchema>;

interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE';
  amount: number;
  balance: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

interface WalletManagementProps {
  className?: string;
}

export function WalletManagement({ className = '' }: WalletManagementProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'topup'>('overview');
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [showTopupModal, setShowTopupModal] = useState(false);

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      return {
        balance: 2500, // KES 25.00 in cents
        availableBalance: 2000, // KES 20.00
        heldBalance: 500, // KES 5.00
        currency: 'KES',
        lastUpdated: new Date().toISOString(),
      };
    },
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', filter],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      const mockTransactions: WalletTransaction[] = [
        {
          id: '1',
          type: 'CREDIT',
          amount: 2000,
          balance: 2500,
          description: 'Wallet top-up via M-Pesa',
          metadata: { method: 'MPESA', transactionId: 'MP123456' },
          createdAt: '2024-03-15T10:30:00Z',
          status: 'COMPLETED',
        },
        {
          id: '2',
          type: 'DEBIT',
          amount: 1500,
          balance: 500,
          description: 'Payment for booking #BK001',
          metadata: { bookingId: 'BK001', serviceType: 'Home Cleaning' },
          createdAt: '2024-03-14T14:20:00Z',
          status: 'COMPLETED',
        },
        {
          id: '3',
          type: 'HOLD',
          amount: 1000,
          balance: 1500,
          description: 'Hold for booking #BK002',
          metadata: { bookingId: 'BK002', serviceType: 'Deep Cleaning' },
          createdAt: '2024-03-13T09:15:00Z',
          status: 'PENDING',
        },
      ];

      if (filter === 'credit') {
        return mockTransactions.filter(t => t.type === 'CREDIT');
      } else if (filter === 'debit') {
        return mockTransactions.filter(t => t.type === 'DEBIT' || t.type === 'HOLD');
      }
      
      return mockTransactions;
    },
  });

  const topupMutation = useMutation({
    mutationFn: async (data: TopupFormData) => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, transactionId: `TXN${Date.now()}` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setShowTopupModal(false);
    },
  });

  const form = useForm<TopupFormData>({
    resolver: zodResolver(topupSchema),
    defaultValues: {
      amount: 1000, // KES 10.00
      method: 'MPESA',
      saveCard: false,
    },
  });

  const getTransactionIcon = (type: string, status: string) => {
    if (type === 'CREDIT') {
      return <Plus className="h-4 w-4 text-green-600" />;
    } else if (type === 'DEBIT') {
      return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    } else if (type === 'HOLD') {
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
    return <Wallet className="h-4 w-4 text-slate-600" />;
  };

  const getTransactionColor = (type: string, status: string) => {
    if (type === 'CREDIT') {
      return status === 'COMPLETED' ? 'text-green-600' : 'text-amber-600';
    } else if (type === 'DEBIT') {
      return status === 'COMPLETED' ? 'text-red-600' : 'text-amber-600';
    } else if (type === 'HOLD') {
      return status === 'PENDING' ? 'text-amber-600' : 'text-slate-600';
    }
    return 'text-slate-600';
  };

  const handleTopup = (data: TopupFormData) => {
    topupMutation.mutate(data);
  };

  const getFilteredTransactions = () => {
    if (!transactionsData) return [];
    
    return transactionsData.filter(transaction => {
      if (filter === 'credit') return transaction.type === 'CREDIT';
      if (filter === 'debit') return transaction.type === 'DEBIT' || transaction.type === 'HOLD';
      return true;
    });
  };

  const exportTransactions = () => {
    // Mock export functionality
    const transactions = getFilteredTransactions();
    const csvContent = [
      'Date,Type,Description,Amount,Balance,Status',
      ...transactions.map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.type,
        t.description,
        (t.amount / 100).toFixed(2),
        (t.balance / 100).toFixed(2),
        t.status,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Wallet Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-ink-900 mb-4">Wallet Balance</h3>
            
            {walletLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-ink-600 mb-2">Available Balance</p>
                  <p className="text-4xl font-bold text-ink-900">
                    {formatKES(walletData?.availableBalance || 0)}
                  </p>
                  <p className="text-sm text-ink-600 mt-2">
                    Total Balance: {formatKES(walletData?.balance || 0)}
                  </p>
                </div>

                {walletData?.heldBalance && walletData.heldBalance > 0 && (
                  <div className="rounded-lg bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">
                        {formatKES(walletData.heldBalance)} on hold for pending bookings
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTopupModal(true)}
                    className="btn-primary flex-1"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Top Up Wallet
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="btn-secondary flex-1"
                  >
                    <History className="mr-2 h-4 w-4" />
                    View Transactions
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-green-100 p-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-ink-900">Total Added</h4>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatKES(5000)}
              </p>
              <p className="text-xs text-ink-500">This month</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-red-100 p-2">
                  <ArrowUpRight className="h-5 w-5 text-red-600" />
                </div>
                <h4 className="font-semibold text-ink-900">Total Spent</h4>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatKES(2500)}
              </p>
              <p className="text-xs text-ink-500">This month</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-ink-900">Transactions</h4>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                24
              </p>
              <p className="text-xs text-ink-500">This month</p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-ink-900">Transaction History</h3>
            
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-ink-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border-0 text-sm font-medium text-ink-700 focus:ring-0"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits Only</option>
                  <option value="debit">Debits Only</option>
                </select>
              </div>

              {/* Export */}
              <button
                onClick={exportTransactions}
                className="btn-secondary px-4 py-2 text-sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="rounded-xl border border-slate-200 bg-white">
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {getFilteredTransactions().map((transaction) => (
                  <div key={transaction.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${
                          transaction.type === 'CREDIT' ? 'bg-green-100' :
                          transaction.type === 'DEBIT' ? 'bg-red-100' :
                          'bg-amber-100'
                        }`}>
                          {getTransactionIcon(transaction.type, transaction.status)}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-ink-900">{transaction.description}</h4>
                          <p className="text-sm text-ink-600">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                          {transaction.metadata && (
                            <div className="text-xs text-ink-500 mt-1">
                              {Object.entries(transaction.metadata).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {value}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(transaction.type, transaction.status)}`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}{formatKES(transaction.amount)}
                        </p>
                        <p className="text-sm text-ink-600">
                          Balance: {formatKES(transaction.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-6 m-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink-900">Top Up Wallet</h3>
              <button
                onClick={() => setShowTopupModal(false)}
                className="btn-ghost p-2"
              >
                ×
              </button>
            </div>

            <form onSubmit={form.handleSubmit(handleTopup)} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Amount (KES)</label>
                <input
                  {...form.register('amount')}
                  type="number"
                  className="input"
                  placeholder="Enter amount"
                  min={500}
                  max={50000}
                  step={100}
                />
                {form.formState.errors.amount && (
                  <p className="mt-1 text-xs text-red-500">{form.formState.errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Payment Method</label>
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
                        <p className="text-sm text-ink-600">Instant, no fees</p>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border-2 border-transparent p-4 transition-colors hover:border-slate-300 peer-checked:border-brand-600 peer-checked:bg-brand-50">
                    <input
                      {...form.register('method')}
                      type="radio"
                      value="STRIPE_CARD"
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-ink-900">Credit/Debit Card</p>
                        <p className="text-sm text-ink-600">Instant, card fees may apply</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    {...form.register('saveCard')}
                    type="checkbox"
                    className="h-4 w-4 text-brand-600 rounded"
                  />
                  <div className="text-sm text-ink-700">
                    <p className="font-medium">Save card details for future use</p>
                    <p className="text-ink-600">Securely store your card for faster checkout</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="btn-ghost px-6 py-3"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={topupMutation.isPending}
                  className="btn-primary px-6 py-3"
                >
                  {topupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Top Up {formatKES(form.getValues('amount'))}
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
          { key: 'overview', label: 'Overview', icon: Wallet },
          { key: 'transactions', label: 'Transactions', icon: History },
          { key: 'topup', label: 'Top Up', icon: Plus },
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
