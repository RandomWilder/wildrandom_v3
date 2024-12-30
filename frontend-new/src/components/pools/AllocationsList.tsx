// src/components/pools/AllocationsList.tsx
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { usePoolStore } from '@/stores/poolStore';
import { LoadingSpinner } from '@/components/ui/loading';
import type { PoolAllocation } from '@/types/pools';

interface AllocationsListProps {
  poolId: number;
  lockStatus: boolean;
}

export function AllocationsList({ poolId, lockStatus }: AllocationsListProps) {
  const { activePool, isLoading } = usePoolStore();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!activePool?.allocations || activePool.allocations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No template allocations yet
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">Template Allocations</h3>
        <div className="mt-4 divide-y divide-gray-200">
          {activePool.allocations.map((allocation: PoolAllocation) => (
            <div key={allocation.id} className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {allocation.template.name}
                  </h4>
                  <div className="mt-1 text-sm text-gray-500">
                    {allocation.quantity} instances | 
                    {allocation.template.type === 'instant_win' 
                      ? ` ${allocation.collective_odds}% collective odds`
                      : ` ${allocation.distribution_type} distribution`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(allocation.template.values.retail * allocation.quantity)}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Total Value
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}