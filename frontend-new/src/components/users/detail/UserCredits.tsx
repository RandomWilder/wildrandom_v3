import React, { useState, useEffect } from 'react';
import { 
  DollarSign,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  Calendar,
  Search,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { useCreditStore } from '@/stores/userCreditStore';
import { CreditBadge } from '../shared/CreditBadge';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { 
  CreditTransaction,
  TransactionFilter,
  UserBalance
} from '@/types/users';
import { TRANSACTION_TYPE_META } from '@/types/users/credits';
import { cn } from '@/lib/utils';

interface UserCreditsProps {
  userId: number;
  className?: string;
}

interface AdjustCreditsModalProps {
  userId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AdjustCreditsModal: React.FC<AdjustCreditsModalProps> = ({
  userId,
  onClose,
  onSuccess
}) => {
  const { adjustUserCredits, isProcessing } = useCreditStore();
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      setError('Please enter a valid amount');
      return;
    }

    if (!notes.trim()) {
      setError('Please provide adjustment notes');
      return;
    }

    try {
      await adjustUserCredits(userId, numericAmount, notes);
      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to adjust credits');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Adjust Credits</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter amount (use negative for deductions)"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              placeholder="Provide reason for adjustment"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Processing...
                </>
              ) : (
                'Submit Adjustment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UserCredits: React.FC<UserCreditsProps> = ({
  userId,
  className
}) => {
  const {
    transactions,
    userBalances,
    totalTransactions,
    isLoading,
    error,
    fetchUserTransactions,
    fetchUserBalance
  } = useCreditStore();

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  // Initial data fetch
  useEffect(() => {
    fetchUserBalance(userId);
    fetchUserTransactions(userId);
  }, [userId, fetchUserBalance, fetchUserTransactions]);

  const userBalance = userBalances[userId];

  // Filtered transactions based on search
  const filteredTransactions = transactions.filter(transaction => 
    transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.reference_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Loading state
  if (isLoading && !transactions.length) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-start space-x-3 text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Credit Balance Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Credit Balance</h3>
            {userBalance && (
              <div className="mt-4 flex items-baseline space-x-4">
                <CreditBadge
                  amount={userBalance.available_amount}
                  pending={userBalance.pending_amount}
                  size="lg"
                  showIcon
                  showIndicator
                />
                <span className="text-sm text-gray-500">
                  Last Updated: {formatDate(userBalance.last_updated)}
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={() => setShowAdjustModal(true)}
            className="flex items-center"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Adjust Credits
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Transaction History
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2
                           text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-4">
            {currentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-start justify-between p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    'rounded-full p-2',
                    TRANSACTION_TYPE_META[transaction.transaction_type].bgColor
                  )}>
                    <CreditCard className={cn(
                      'h-5 w-5',
                      TRANSACTION_TYPE_META[transaction.transaction_type].color
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {TRANSACTION_TYPE_META[transaction.transaction_type].label}
                    </p>
                    {transaction.notes && (
                      <p className="mt-1 text-sm text-gray-500">
                        {transaction.notes}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(transaction.created_at)}
                      </span>
                      {transaction.reference_id && (
                        <span className="flex items-center">
                          <span className="font-mono">{transaction.reference_id}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-lg font-semibold',
                    transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {transaction.amount >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Balance: {formatCurrency(transaction.balance_after)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(current => Math.max(1, current - 1))}
                disabled={currentPage === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(current => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Adjust Credits Modal */}
      {showAdjustModal && (
        <AdjustCreditsModal
          userId={userId}
          onClose={() => setShowAdjustModal(false)}
          onSuccess={() => {
            // Refresh data after successful adjustment
            fetchUserBalance(userId);
            fetchUserTransactions(userId);
          }}
        />
      )}
    </div>
  );
};

export default UserCredits;