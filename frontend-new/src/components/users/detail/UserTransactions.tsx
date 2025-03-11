// src/components/users/detail/UserTransactions.tsx
import React, { useEffect, useState } from 'react';
import { 
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransactionStore } from '@/stores/userTransactionStore';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { TransactionStatus, TransactionReferenceType } from '@/api/userTransactionsApi';
import { LoadingSpinner } from '@/components/ui/loading';
import { cn } from '@/lib/utils';

interface UserTransactionsProps {
  userId: number;
  className?: string;
}

// Transaction type metadata for UI display
const TRANSACTION_TYPE_META: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  'credit': {
    label: 'Credit',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: <ArrowDownLeft className="h-4 w-4" />
  },
  'debit': {
    label: 'Debit',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: <ArrowUpRight className="h-4 w-4" />
  }
};

// Transaction status metadata
const TRANSACTION_STATUS_META: Record<TransactionStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  'pending': {
    label: 'Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50'
  },
  'completed': {
    label: 'Completed',
    color: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  'failed': {
    label: 'Failed',
    color: 'text-red-700',
    bgColor: 'bg-red-50'
  },
  'rolled_back': {
    label: 'Rolled Back',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50'
  }
};

// Reference type metadata
const REFERENCE_TYPE_META: Record<TransactionReferenceType, {
  label: string;
  description: string;
}> = {
  'ticket_purchase': {
    label: 'Ticket Purchase',
    description: 'Purchase of raffle tickets'
  },
  'prize_claim': {
    label: 'Prize Claim',
    description: 'Claim of a prize'
  },
  'refund': {
    label: 'Refund',
    description: 'Refund of a previous transaction'
  },
  'adjustment': {
    label: 'Adjustment',
    description: 'Manual adjustment by admin'
  }
};

export const UserTransactions: React.FC<UserTransactionsProps> = ({
  userId,
  className
}) => {
  const {
    transactions,
    totalTransactions,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchUserTransactions,
    setFilters
  } = useTransactionStore();

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | ''>('');
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<TransactionReferenceType | ''>('');
  const [sortConfig, setSortConfig] = useState<{
    field: 'created_at' | 'amount' | 'status';
    direction: 'asc' | 'desc';
  }>({
    field: 'created_at',
    direction: 'desc'
  });

  // Initial data fetch with sorting
  useEffect(() => {
    fetchUserTransactions(userId, {
      sort_by: sortConfig.field,
      sort_direction: sortConfig.direction
    });
  }, [userId, fetchUserTransactions, sortConfig.field, sortConfig.direction]);

  // Apply filters
  const applyFilters = () => {
    const filters: any = {
      sort_by: sortConfig.field,
      sort_direction: sortConfig.direction
    };
    
    if (statusFilter) filters.status = statusFilter;
    if (referenceTypeFilter) filters.reference_type = referenceTypeFilter;
    
    setFilters(filters);
    fetchUserTransactions(userId, filters);
  };
  
  // Handle sorting
  const handleSort = (field: 'created_at' | 'amount' | 'status') => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc'
    }));
    
    // Apply the new sort config
    const newFilters = {
      ...useTransactionStore.getState().filters,
      sort_by: field,
      sort_direction: (sortConfig.field === field && sortConfig.direction === 'desc' ? 'asc' : 'desc') as 'asc' | 'desc'
    };
    
    setFilters(newFilters);
    fetchUserTransactions(userId, newFilters);
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('');
    setReferenceTypeFilter('');
    // Preserve sorting when clearing other filters
    setFilters({
      sort_by: sortConfig.field,
      sort_direction: sortConfig.direction
    });
    fetchUserTransactions(userId, {
      sort_by: sortConfig.field,
      sort_direction: sortConfig.direction
    });
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      fetchUserTransactions(userId, { ...useTransactionStore.getState().filters, page: newPage });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      fetchUserTransactions(userId, { ...useTransactionStore.getState().filters, page: newPage });
    }
  };

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
      {/* Header with Sorting Options */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
          <div className="ml-4 flex items-center text-sm text-gray-500 space-x-2">
            <span className="text-gray-600">Sort by:</span>
            <button
              onClick={() => handleSort('created_at')}
              className={`flex items-center px-2 py-1 rounded hover:bg-gray-100 ${
                sortConfig.field === 'created_at' ? 'text-indigo-600 font-medium' : ''
              }`}
            >
              Date
              {sortConfig.field === 'created_at' && (
                sortConfig.direction === 'asc' 
                  ? <ArrowUp className="h-3 w-3 ml-1" />
                  : <ArrowDown className="h-3 w-3 ml-1" />
              )}
            </button>
            <button
              onClick={() => handleSort('amount')}
              className={`flex items-center px-2 py-1 rounded hover:bg-gray-100 ${
                sortConfig.field === 'amount' ? 'text-indigo-600 font-medium' : ''
              }`}
            >
              Amount
              {sortConfig.field === 'amount' && (
                sortConfig.direction === 'asc' 
                  ? <ArrowUp className="h-3 w-3 ml-1" />
                  : <ArrowDown className="h-3 w-3 ml-1" />
              )}
            </button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | '')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {Object.keys(TRANSACTION_STATUS_META).map((status) => (
                  <option key={status} value={status}>
                    {TRANSACTION_STATUS_META[status as TransactionStatus].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Type
              </label>
              <select
                value={referenceTypeFilter}
                onChange={(e) => setReferenceTypeFilter(e.target.value as TransactionReferenceType | '')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {Object.keys(REFERENCE_TYPE_META).map((type) => (
                  <option key={type} value={type}>
                    {REFERENCE_TYPE_META[type as TransactionReferenceType].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-end space-x-2">
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Transaction List */}
      {transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-start justify-between p-4 rounded-lg border border-gray-200"
            >
              <div className="flex items-start space-x-4">
                <div className={cn(
                  'rounded-full p-2',
                  TRANSACTION_TYPE_META[transaction.type]?.bgColor || 'bg-gray-50'
                )}>
                  {TRANSACTION_TYPE_META[transaction.type]?.icon || <CreditCard className="h-5 w-5 text-gray-400" />}
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-medium text-gray-900">
                      {REFERENCE_TYPE_META[transaction.reference_type]?.label || transaction.reference_type}
                    </p>
                    <span className={cn(
                      'ml-2 px-2 py-0.5 text-xs rounded-full',
                      TRANSACTION_STATUS_META[transaction.status]?.bgColor,
                      TRANSACTION_STATUS_META[transaction.status]?.color
                    )}>
                      {TRANSACTION_STATUS_META[transaction.status]?.label || transaction.status}
                    </span>
                  </div>
                  
                  {transaction.meta_data?.reason && (
                    <p className="mt-1 text-sm text-gray-500">
                      {transaction.meta_data.reason}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span 
                      className="flex items-center cursor-pointer hover:text-indigo-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSort('created_at');
                      }}
                      title="Sort by date"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(transaction.created_at)}
                      {sortConfig.field === 'created_at' && (
                        sortConfig.direction === 'asc' 
                          ? <ArrowUp className="h-3 w-3 ml-1" />
                          : <ArrowDown className="h-3 w-3 ml-1" />
                      )}
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
                <p 
                  className={cn(
                    'text-lg font-semibold flex items-center justify-end cursor-pointer',
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSort('amount');
                  }}
                  title="Sort by amount"
                >
                  {transaction.type === 'credit' ? '+' : '-'}
                  {formatCurrency(Math.abs(transaction.amount))}
                  {sortConfig.field === 'amount' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' 
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                      }
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Balance: {formatCurrency(transaction.balance_after)}
                </p>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No transactions found.
        </div>
      )}
    </div>
  );
};

export default UserTransactions;