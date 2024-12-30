// src/pages/admin/raffles/[id]/index.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { NextPageWithLayout } from '@/types/next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { useRaffleStore } from '@/stores/raffleStore';
import { RaffleOverviewTab } from '@/components/raffles/admin/tabs/RaffleOverviewTab';
import { RaffleTicketsTab } from '@/components/raffles/admin/tabs/RaffleTicketsTab';
import { RaffleDrawsTab } from '@/components/raffles/admin/tabs/RaffleDrawsTab';
import { RaffleWinnersTab } from '@/components/raffles/admin/tabs/RaffleWinnersTab';
import RaffleControls from '@/components/raffles/admin/RaffleControls';
import { ArrowLeft } from 'lucide-react';

/**
 * RaffleDetailPage
 * 
 * Comprehensive raffle management interface implementing:
 * - Tab-based information architecture
 * - Persistent URL state management
 * - Graceful loading and error states
 * - Efficient data synchronization
 */
const RaffleDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id, tab } = router.query;
  const raffleId = typeof id === 'string' ? parseInt(id) : undefined;

  const {
    currentRaffle,
    isLoading,
    error,
    loadRaffle,
    loadStats,
    clearError
  } = useRaffleStore();

  // Strategic data initialization and cleanup
  useEffect(() => {
    if (raffleId) {
      clearError();
      loadRaffle(raffleId);
      loadStats(raffleId);
    }

    return () => {
      clearError(); // Ensure clean state on unmount
    };
  }, [raffleId, loadRaffle, loadStats, clearError]);

  // URL-based tab management
  const handleTabChange = (value: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: value }
      },
      undefined,
      { shallow: true }
    );
  };

  // Navigation guard
  if (!raffleId) {
    router.push('/admin/raffles');
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // Error boundary
  if (error || !currentRaffle) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <div className="p-6">
          <h2 className="text-lg font-medium text-red-800 mb-2">
            {error || 'Raffle not found'}
          </h2>
          <button
            onClick={() => router.push('/admin/raffles')}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Raffles
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation and Context */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/raffles')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Raffles
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {currentRaffle.title}
        </h1>
        {currentRaffle.description && (
          <p className="mt-1 text-gray-500 max-w-3xl">{currentRaffle.description}</p>
        )}
      </div>

      {/* Raffle Controls */}
      <RaffleControls
        raffleId={raffleId}
        currentState={currentRaffle.state}
        currentStatus={currentRaffle.status}
      />

      {/* Tab Interface */}
      <Card className="mt-6">
        <Tabs
          defaultValue={tab as string || 'overview'}
          value={tab as string || 'overview'}
          onValueChange={handleTabChange}
          className="p-6"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="draws">Draws</TabsTrigger>
            <TabsTrigger value="winners">Winners</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <RaffleOverviewTab raffle={currentRaffle} />
          </TabsContent>

          <TabsContent value="tickets">
            <RaffleTicketsTab raffleId={raffleId} />
          </TabsContent>

          <TabsContent value="draws">
            <RaffleDrawsTab
              raffleId={raffleId}
              canExecuteDraw={currentRaffle.state === 'ended'}
            />
          </TabsContent>

          <TabsContent value="winners">
            <RaffleWinnersTab raffleId={raffleId} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

// Layout configuration
RaffleDetailPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

// Security configuration
RaffleDetailPage.requireAuth = true;

export default RaffleDetailPage;