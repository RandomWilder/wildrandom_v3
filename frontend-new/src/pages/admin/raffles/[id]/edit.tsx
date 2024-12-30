import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import RaffleForm from '@/components/raffles/admin/RaffleForm';
import { useRaffleStore } from '@/stores/raffleStore';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';

const EditRafflePage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { currentRaffle, loadRaffle, isLoading, error } = useRaffleStore();

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadRaffle(parseInt(id));
    }
  }, [id, loadRaffle]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (error || !currentRaffle) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <div className="text-red-600 bg-red-50 p-4 rounded">
            {error || 'Raffle not found'}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Raffle</h1>
            <p className="text-muted-foreground">
              Update raffle configuration for: {currentRaffle.title}
            </p>
          </div>
        </div>

        <Card className="p-6">
          <RaffleForm
            initialData={currentRaffle}
            onSuccess={() => {
              router.push(`/admin/raffles/${id}`);
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EditRafflePage;