// src/components/users/detail/UserBalanceAdjustment.tsx
import React, { useState } from 'react';
import { 
  DollarSign, 
  AlertCircle,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { useBalanceAdjustmentApi } from '@/hooks/useBalanceAdjustmentApi';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';

interface UserBalanceAdjustmentProps {
  userId: number;
  currentBalance: number;
  className?: string;
  onSuccess?: () => void;
}

export const UserBalanceAdjustment: React.FC<UserBalanceAdjustmentProps> = ({
  userId,
  currentBalance,
  className,
  onSuccess
}) => {
  // Form state
  const [amount, setAmount] = useState<string>('');
  const [isCredit, setIsCredit] = useState<boolean>(true);
  const [reason, setReason] = useState<string>('');
  
  // Validation state
  const [errors, setErrors] = useState<{
    amount?: string;
    reason?: string;
    general?: string;
  }>({});

  // API hook
  const { adjustBalance, isLoading, error } = useBalanceAdjustmentApi();

  // Input validation
  const validateInputs = (): boolean => {
    const newErrors: typeof errors = {};

    // Amount validation
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (numAmount < 0.01) {
      newErrors.amount = 'Amount must be at least 0.01';
    } else if (!isCredit && numAmount > currentBalance) {
      newErrors.amount = 'Deduction amount cannot exceed current balance';
    }

    // Reason validation
    if (!reason) {
      newErrors.reason = 'Please provide a reason for the adjustment';
    } else if (reason.length < 5) {
      newErrors.reason = 'Reason must be at least 5 characters';
    } else if (reason.length > 255) {
      newErrors.reason = 'Reason cannot exceed 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) {
      return;
    }

    try {
      await adjustBalance({
        user_id: userId,
        amount: parseFloat(amount),
        is_credit: isCredit,
        reason
      });
      
      // Reset form on success
      setAmount('');
      setReason('');
      setErrors({});
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setErrors({
        general: error || 'An error occurred while adjusting balance'
      });
    }
  };

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Adjust User Balance</h3>
          <p className="text-sm font-medium text-gray-500">
            Current Balance: <span className="text-gray-900">{formatCurrency(currentBalance)}</span>
          </p>
        </div>

        {/* Error Display */}
        {(errors.general || error) && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {errors.general || error}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(
                  "block w-full pl-10 pr-12 py-2 rounded-md",
                  errors.amount
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                )}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                aria-invalid={errors.amount ? "true" : "false"}
              />
            </div>
            {errors.amount && (
              <p className="mt-2 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Credit/Debit Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operation Type
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setIsCredit(true)}
                className={cn(
                  "flex-1 flex items-center justify-center px-4 py-2 border rounded-md",
                  isCredit
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Credits
              </button>
              <button
                type="button"
                onClick={() => setIsCredit(false)}
                className={cn(
                  "flex-1 flex items-center justify-center px-4 py-2 border rounded-md",
                  !isCredit
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                <MinusCircle className="h-5 w-5 mr-2" />
                Deduct Credits
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason <span className="text-gray-400 text-xs">(5-255 characters)</span>
            </label>
            <div className="mt-1">
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className={cn(
                  "block w-full rounded-md shadow-sm",
                  errors.reason
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                )}
                aria-invalid={errors.reason ? "true" : "false"}
              />
            </div>
            {errors.reason && (
              <p className="mt-2 text-sm text-red-600">{errors.reason}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {255 - reason.length} characters remaining
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                `Submit ${isCredit ? 'Credit' : 'Deduction'}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default UserBalanceAdjustment;