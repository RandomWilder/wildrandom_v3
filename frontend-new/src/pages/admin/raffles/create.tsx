import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { AdminLayout } from '@/components/layout/AdminLayout';
import RaffleForm from '@/components/raffles/admin/RaffleForm';
import { Card } from '@/components/ui/card';

const CreateRafflePage: NextPage = () => {
  const router = useRouter();

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Raffle</h1>
            <p className="text-muted-foreground">
              Configure and launch a new raffle campaign
            </p>
          </div>
        </div>

        <Card className="p-6">
          <RaffleForm
            onSuccess={() => {
              // Navigate back to raffles list after successful creation
              router.push('/admin/raffles');
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CreateRafflePage;