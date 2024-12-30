import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { useRaffleStore } from '@/stores/raffleStore';
import { RaffleViews } from '@/components/raffles/RaffleViews';
import type { Raffle } from '@/types/raffles';

const RafflesListPage: NextPage = () => {
  const router = useRouter();
  const { loadRaffles, raffles, isLoading, error } = useRaffleStore();

  useEffect(() => {
    loadRaffles();
  }, [loadRaffles]);

  // Navigate to raffle tickets page
  const handleRaffleClick = (raffle: Raffle) => {
    router.push(`/admin/raffles/${raffle.id}/tickets`);
  };

  // Create new raffle
  const handleCreateRaffle = () => {
    router.push('/admin/raffles/create');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Raffles</h1>
            <p className="text-muted-foreground">
              Manage all raffle campaigns
            </p>
          </div>
          <Button onClick={handleCreateRaffle}>
            <Plus className="mr-2 h-4 w-4" />
            Create Raffle
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600">
            {error}
          </div>
        )}

        {/* Raffle Views Component */}
        <RaffleViews 
          raffles={raffles || []}
          onRaffleClick={handleRaffleClick}
        />
      </div>
    </AdminLayout>
  );
};

export default RafflesListPage;