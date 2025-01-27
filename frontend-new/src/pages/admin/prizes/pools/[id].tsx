// src/pages/admin/prizes/pools/[id].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft,
  Plus,
  Trophy,
  AlertCircle,
  Lock
} from 'lucide-react';
import type { NextPageWithLayout } from '@/types/next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { usePoolStore } from '@/stores/poolStore';
import { usePrizeStore } from '@/stores/prizeStore';
import { TemplateAllocationForm } from '@/components/pools/TemplateAllocationForm';
import { AllocationsList } from '@/components/pools/AllocationsList';
import { PoolHeader } from '@/components/pools/PoolHeader';
import { PrizeInstances } from '@/components/pools/PrizeInstances';
import { formatCurrency } from '@/utils/currency';
import { POOL_STATUS_META } from '@/types/pools';

const PoolDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const poolId = parseInt(id as string);

  const { 
    activePool,
    instances,
    instancesSummary,
    isLoading: poolLoading,
    isLoadingInstances,
    error: poolError,
    getPool,
    lockPool,
    fetchInstances
  } = usePoolStore();

  const {
    templates,
    isLoading: templatesLoading,
    fetchTemplates
  } = usePrizeStore();

  const [showAllocationForm, setShowAllocationForm] = useState(false);

  useEffect(() => {
    if (poolId) {
      getPool(poolId);
      fetchTemplates();
      fetchInstances(poolId);
    }
  }, [poolId, getPool, fetchTemplates, fetchInstances]);

  const handleLockPool = async () => {
    if (!activePool) return;
    
    try {
      await lockPool(activePool.id);
      // Refresh pool data after locking
      getPool(activePool.id);
      fetchInstances(activePool.id);
    } catch (error) {
      console.error('Failed to lock pool:', error);
    }
  };

  if (poolLoading || templatesLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (poolError) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Pool
            </h3>
            <p className="mt-2 text-sm text-red-700">{poolError}</p>
            <button
              onClick={() => poolId && getPool(poolId)}
              className="mt-4 text-sm font-medium text-red-800 hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activePool) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Pools
        </button>
        
        <PoolHeader pool={activePool} onLock={handleLockPool} />
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Pool Statistics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Instances</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {activePool.total_instances}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex text-sm">
                  <p className="flex-1 text-gray-500">Instant Win</p>
                  <p className="font-medium">{activePool.instant_win_instances}</p>
                </div>
                <div className="flex text-sm mt-1">
                  <p className="flex-1 text-gray-500">Draw Win</p>
                  <p className="font-medium">{activePool.draw_win_instances}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {formatCurrency(activePool.values?.retail_total ?? 0)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex text-sm">
                  <p className="flex-1 text-gray-500">Cash Value</p>
                  <p className="font-medium">
                    {formatCurrency(activePool.values?.cash_total ?? 0)}
                  </p>
                </div>
                <div className="flex text-sm mt-1">
                  <p className="flex-1 text-gray-500">Credit Value</p>
                  <p className="font-medium">
                    {formatCurrency(activePool.values?.credit_total ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Odds</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {activePool.total_odds?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}%
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-500">
                  {activePool.total_odds < 100
                    ? `${(100 - activePool.total_odds)?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}% remaining`
                    : 'Odds complete'}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="mt-2">
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                      ${POOL_STATUS_META[activePool.status].bgColor}
                      ${POOL_STATUS_META[activePool.status].color}
                    `}>
                      {POOL_STATUS_META[activePool.status].label}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-500">
                  {POOL_STATUS_META[activePool.status].description}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Template Allocations */}
        {activePool.status === 'unlocked' && (
          <div className="space-y-4">
            {!showAllocationForm ? (
              <button
                onClick={() => setShowAllocationForm(true)}
                className="inline-flex items-center px-4 py-2 rounded-lg
                         bg-indigo-600 text-white hover:bg-indigo-700 
                         transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Template Allocation
              </button>
            ) : (
              <Card>
                <div className="p-6">
                  <TemplateAllocationForm
                    poolId={activePool.id}
                    templates={templates}
                    onSuccess={() => {
                      setShowAllocationForm(false);
                      getPool(activePool.id);
                    }}
                    onCancel={() => setShowAllocationForm(false)}
                  />
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Existing Allocations */}
        <AllocationsList
          poolId={activePool.id}
          lockStatus={activePool.status !== 'unlocked'}
        />

        {/* Prize Instances */}
        {activePool.status !== 'unlocked' && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Prize Instances</h2>
            <PrizeInstances
              poolId={poolId}
              instances={instances}
              isLoading={isLoadingInstances}
              summary={instancesSummary || {
                available: 0,
                claimed: 0,
                discovered: 0,
                expired: 0,
                voided: 0
              }}
            />
          </div>
        )}

        {/* Lock Pool Button */}
        {activePool.status === 'unlocked' && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleLockPool}
              disabled={activePool.total_odds !== 100 || activePool.draw_win_instances === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg
                       bg-indigo-600 text-white hover:bg-indigo-700 
                       transition-colors shadow-sm disabled:opacity-50
                       disabled:cursor-not-allowed"
              title={
                activePool.total_odds !== 100
                  ? 'Total odds must equal 100%'
                  : activePool.draw_win_instances === 0
                  ? 'At least one draw win prize is required'
                  : 'Lock pool'
              }
            >
              <Lock className="w-5 h-5 mr-2" />
              Lock Pool
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

PoolDetailPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

PoolDetailPage.requireAuth = true;

export default PoolDetailPage;