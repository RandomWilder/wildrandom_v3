// src/components/raffles/admin/RaffleDetailView.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useRaffleStore } from '@/stores/raffleStore';
import RaffleControls from './RaffleControls';
import { RaffleOverviewTab } from './tabs/RaffleOverviewTab';
import { RaffleTicketsTab } from './tabs/RaffleTicketsTab';
import { RaffleDrawsTab } from './tabs/RaffleDrawsTab';
import { RaffleWinnersTab } from './tabs/RaffleWinnersTab';
import { LoadingSpinner } from '@/components/ui/loading';

export const RaffleDetailView = () => {
  const router = useRouter();
  const { id } = router.query;
  const raffleId = parseInt(id as string);

  const { 
    currentRaffle, 
    isLoading, 
    error,
    loadRaffle,
    loadStats 
  } = useRaffleStore();

  useEffect(() => {
    if (raffleId) {
      // Load main raffle data
      loadRaffle(raffleId);
      // Separately load stats data
      loadStats(raffleId);
    }
  }, [raffleId, loadRaffle, loadStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !currentRaffle) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-800">
            {error || 'Raffle not found'}
          </h3>
          <button
            onClick={() => router.push('/admin/raffles')}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-500"
          >
            Return to Raffles
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/admin/raffles')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Raffles
        </button>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {currentRaffle.title}
        </h1>
        {currentRaffle.description && (
          <p className="mt-1 text-gray-500">{currentRaffle.description}</p>
        )}
      </div>

      {/* Controls */}
      <RaffleControls
        raffleId={raffleId}
        currentState={currentRaffle.state}
        currentStatus={currentRaffle.status}
      />

      {/* Tabbed Interface */}
      <Card className="mt-6">
        <Tabs defaultValue="overview" className="p-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="draws">Draws</TabsTrigger>
            <TabsTrigger value="winners">Winners</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <RaffleOverviewTab raffle={currentRaffle} />
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <RaffleTicketsTab raffleId={raffleId} />
          </TabsContent>

          <TabsContent value="draws" className="mt-6">
            <RaffleDrawsTab
              raffleId={raffleId}
              canExecuteDraw={currentRaffle.state === 'ended'}
            />
          </TabsContent>

          <TabsContent value="winners" className="mt-6">
            <RaffleWinnersTab raffleId={raffleId} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default RaffleDetailView;