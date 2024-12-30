// Path: src/pages/admin/raffles/[id]/index.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import type { NextPageWithLayout } from '@/types/next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useRaffleStore } from '@/stores/raffleStore';
import RaffleControls from '@/components/raffles/admin/RaffleControls';
import RaffleDraws from '@/components/raffles/admin/RaffleDraws';
import { RaffleStatsPanel } from '@/components/raffles/shared/RaffleStatsPanel';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RaffleState, RaffleStatus, type StateUpdatePayload, type StatusUpdatePayload } from '@/types/raffles';

const RaffleDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const raffleId = parseInt(id as string);

  const { 
    currentRaffle,
    raffleStats,
    isLoading,
    error,
    loadRaffle,
    loadStats,
    updateRaffleStatus,  // Renamed for clarity
    updateRaffleState,   // Renamed for clarity
    executeDraw
} = useRaffleStore(state => state);  // Explicit state selection

useEffect(() => {
  if (raffleId) {
    loadRaffle(raffleId);
    loadStats(raffleId);
  }
}, [raffleId, loadRaffle, loadStats]);

const handleStateChange = async (newState: RaffleState) => {
  if (!raffleId) return;
  
  const payload: StateUpdatePayload = {
    state: newState,
    reason: `State changed to ${newState}`
  };

  try {
    await updateRaffleState(raffleId, payload);
    await loadRaffle(raffleId);
  } catch (error) {
    console.error('Failed to update state:', error);
  }
};

const handleStatusChange = async (newStatus: RaffleStatus) => {
  if (!raffleId) return;

  const payload: StatusUpdatePayload = {
    status: newStatus,
    reason: `Status changed to ${newStatus}`
  };

  try {
    await updateRaffleStatus(raffleId, payload);
    await loadRaffle(raffleId);
  } catch (error) {
    console.error('Failed to update status:', error);
  }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !currentRaffle) {
    return (
      <Card className="m-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-red-800">Error</h2>
          <p className="mt-2 text-sm text-red-600">{error || 'Raffle not found'}</p>
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/admin/raffles')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Raffles
        </button>
        
        <div className="mt-4">
          <h1 className="text-2xl font-bold">{currentRaffle.title}</h1>
          {currentRaffle.description && (
            <p className="mt-1 text-gray-500">{currentRaffle.description}</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <RaffleControls
        raffleId={raffleId}
        currentState={currentRaffle.state}
        currentStatus={currentRaffle.status}
        onStateChange={handleStateChange}
        onStatusChange={handleStatusChange}
      />

      {/* Stats */}
      {raffleStats && (
        <RaffleStatsPanel stats={raffleStats} />
      )}

      {/* Tabbed Content */}
      <Card>
        <Tabs defaultValue="overview" className="p-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="draws">Draws</TabsTrigger>
            <TabsTrigger value="winners">Winners</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Overview content */}
          </TabsContent>

          <TabsContent value="tickets">
            {/* Ticket management component */}
          </TabsContent>

          <TabsContent value="draws">
            <RaffleDraws
              raffleId={raffleId}
              canExecuteDraw={currentRaffle.state === 'ended'}
              onExecuteDraw={() => executeDraw(raffleId)}
            />
          </TabsContent>

          <TabsContent value="winners">
            {/* Winners list component */}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

RaffleDetailPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

RaffleDetailPage.requireAuth = true;

export default RaffleDetailPage;