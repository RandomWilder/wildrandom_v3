import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus } from 'lucide-react';
import type { NextPageWithLayout } from '@/types/next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PoolViews } from '@/components/pools/PoolViews';
import { usePoolStore } from '@/stores/poolStore';
import type { PrizePool } from '@/types/pools';

const PoolsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { pools, isLoading, error, fetchPools, lockPool } = usePoolStore();

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const handleCreatePool = () => {
    router.push('/admin/prizes/pools/create');
  };

  const handlePoolClick = (pool: PrizePool) => {
    router.push(`/admin/prizes/pools/${pool.id}`);
  };

  const handleLockPool = async (pool: PrizePool) => {
    try {
      await lockPool(pool.id);
    } catch (error) {
      console.error('Failed to lock pool:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prize Pools</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage prize pools and template allocations
          </p>
        </div>
        <button
          onClick={handleCreatePool}
          className="inline-flex items-center px-4 py-2 rounded-lg
                   bg-indigo-600 text-white hover:bg-indigo-700 
                   transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Pool
        </button>
      </div>

      {/* Pool Views */}
      <PoolViews
        pools={pools}
        onPoolClick={handlePoolClick}
        onLockPool={handleLockPool}
      />
    </div>
  );
};

PoolsPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

PoolsPage.requireAuth = true;

export default PoolsPage;