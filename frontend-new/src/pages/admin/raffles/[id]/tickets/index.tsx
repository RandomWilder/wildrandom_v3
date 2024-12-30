import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { useRaffleStore } from '@/stores/raffleStore';
import { TicketList } from '@/components/raffles/tickets/TicketList';

const TicketListPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const raffleId = parseInt(id as string);

  const { 
    loadRaffle, 
    loadTickets,
    currentRaffle,
    tickets,
    totalTickets,
    isLoading,
    isLoadingTickets,
    error,
    ticketError
  } = useRaffleStore();

  useEffect(() => {
    if (raffleId) {
      loadRaffle(raffleId);
      loadTickets(raffleId);
    }
  }, [raffleId, loadRaffle, loadTickets]);

  if (isLoading || isLoadingTickets) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (!currentRaffle) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error || 'Raffle not found'}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/raffles')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Raffles
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentRaffle.title} - Tickets
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and monitor ticket status
              </p>
            </div>
            <div className="text-sm text-right">
              <p>Total Tickets: {currentRaffle.total_tickets}</p>
              <p>Price: ${currentRaffle.ticket_price}</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {ticketError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600">
            {ticketError}
          </div>
        )}

        {/* Ticket List */}
        <TicketList 
          tickets={tickets}
          totalTickets={totalTickets}
          isLoading={isLoadingTickets}
        />
      </div>
    </AdminLayout>
  );
};

export default TicketListPage;