import React, { useEffect, useState } from 'react';
import { Plus, AlertCircle, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/router';
import { useRaffleStore } from '@/stores/raffleStore';
import { RaffleState, RaffleStatus } from '@/types/raffles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import RaffleStatusBadge from '../shared/RaffleStatusBadge';
import RaffleStateChip from '../shared/RaffleStateChip';
import RaffleStatsPanel from '../shared/RaffleStatsPanel';

const REFRESH_INTERVAL = 30000; // 30 seconds

interface DashboardStats {
  totalRaffles: number;
  activeRaffles: number;
  endedRaffles: number;
  totalParticipants: number;
}

export const RaffleAdminDashboard: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalRaffles: 0,
    activeRaffles: 0,
    endedRaffles: 0,
    totalParticipants: 0
  });

  const {
    currentRaffle,
    raffleStats,
    isLoading,
    error,
    loadRaffle,
    loadStats
  } = useRaffleStore();

  // Polling setup
  useEffect(() => {
    const pollData = () => {
      if (currentRaffle?.id) {
        loadRaffle(currentRaffle.id);
        loadStats(currentRaffle.id);
      }
    };

    const interval = setInterval(pollData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [currentRaffle?.id, loadRaffle, loadStats]);

  // Calculate dashboard statistics
  useEffect(() => {
    if (currentRaffle && raffleStats) {
      setStats({
        totalRaffles: 1, // Increment as we load more raffles
        activeRaffles: currentRaffle.status === RaffleStatus.ACTIVE ? 1 : 0,
        endedRaffles: currentRaffle.state === RaffleState.ENDED ? 1 : 0,
        totalParticipants: raffleStats.unique_participants
      });
    }
  }, [currentRaffle, raffleStats]);

  const handleCreateRaffle = () => {
    router.push('/admin/raffles/create');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Raffle Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all raffle operations
          </p>
        </div>
        <Button onClick={handleCreateRaffle}>
          <Plus className="mr-2 h-4 w-4" />
          Create Raffle
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center p-4">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raffles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRaffles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Raffles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRaffles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ended Raffles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.endedRaffles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Raffle Section */}
      {currentRaffle && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Raffle</CardTitle>
              <Button variant="outline" size="sm" onClick={() => loadRaffle(currentRaffle.id)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
            <CardDescription>
              Manage and monitor the current raffle status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{currentRaffle.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <RaffleStatusBadge status={currentRaffle.status} />
                    <RaffleStateChip state={currentRaffle.state} />
                  </div>
                </div>
                <Button
                  onClick={() => router.push(`/admin/raffles/${currentRaffle.id}`)}
                  variant="outline"
                >
                  View Details
                </Button>
              </div>
              {raffleStats && <RaffleStatsPanel stats={raffleStats} />}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RaffleAdminDashboard;