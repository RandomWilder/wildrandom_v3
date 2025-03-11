// src/pages/raffles/[id]/tickets/index.tsx - Update this file

import { FC, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  Gift, 
  Trophy, 
  AlertTriangle, 
  RefreshCw, 
  ChevronLeft,
  Loader
} from 'lucide-react';

// Import hooks and components
import { useRaffleTickets } from '../../../../hooks/useRaffleTickets';
import { FeatureErrorBoundary } from '../../../../components/common/ErrorBoundary';
import Button from '../../../../components/common/Button';
import TicketGridComponent from '../../../../components/features/tickets/TicketGridComponent';
import useRaffleDetails from '../../../../hooks/useRaffleDetails';
import { adaptTicketForGridComponent } from '../../../../utils/ticketAdapter';

/**
 * RaffleTicketsPage Component
 * 
 * Displays tickets for a specific raffle with interactive elements
 * for ticket operations (reveal, discover prizes, claim)
 */
const RaffleTicketsPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const raffleId = id ? parseInt(id, 10) : 0;
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  
  // Fetch tickets for this specific raffle
  const { 
    tickets, 
    isLoading, 
    error, 
    processingTickets,
    fetchTickets,
    revealTicket,
    discoverPrize,
    claimPrize
  } = useRaffleTickets({ raffleId });
  
  // Fetch raffle details to show name and other info
  const { 
    raffleDetails, 
    isLoading: isLoadingRaffle, 
    error: raffleError 
  } = useRaffleDetails(raffleId);

  // Mark initial fetch as complete
  useEffect(() => {
    if (!isLoading && !hasInitialFetch) {
      setHasInitialFetch(true);
    }
  }, [isLoading, hasInitialFetch]);

  // Calculate ticket statistics
  const ticketStats = useMemo(() => {
    return {
      total: tickets.length,
      unrevealed: tickets.filter(t => t.status === 'sold').length,
      revealed: tickets.filter(t => t.status === 'revealed').length,
      discovered: tickets.filter(t => t.status === 'discovered').length,
      claimed: tickets.filter(t => t.status === 'claimed').length,
      hasPrizes: tickets.some(t => t.status === 'discovered' || t.status === 'claimed')
    };
  }, [tickets]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await fetchTickets();
    } catch (err) {
      console.error('Failed to refresh tickets:', err);
    }
  };

  // Navigate back to my tickets page
  const handleBackToMyTickets = () => {
    navigate('/my-tix');
  };

  // Handle ticket operations
  const handleRevealTicket = async (ticketId: string) => {
    try {
      await revealTicket(ticketId);
    } catch (err) {
      console.error(`Failed to reveal ticket ${ticketId}:`, err);
    }
  };

  const handleDiscoverPrize = async (ticketId: string) => {
    try {
      await discoverPrize(ticketId);
    } catch (err) {
      console.error(`Failed to discover prize for ticket ${ticketId}:`, err);
    }
  };

  // Simplified claim prize handler to match TicketGridComponent interface
  const handleClaimPrize = async (_: string, prizeId: string) => {
    try {
      // Default to credit claim type for simplicity
      await claimPrize(prizeId, 'credit');
    } catch (err) {
      console.error(`Failed to claim prize ${prizeId}:`, err);
    }
  };

  // Transform API tickets to component format using our adapter
  const adaptedTickets = useMemo(() => {
  return tickets.map(ticket => 
    adaptTicketForGridComponent(ticket, raffleDetails?.title || '')
  );
}, [tickets, raffleDetails]);

  return (
    <FeatureErrorBoundary feature="Raffle Tickets">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <button 
              onClick={handleBackToMyTickets}
              className="mr-3 p-2 rounded-full hover:bg-gray-100"
              aria-label="Back to My Tickets"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isLoadingRaffle ? 'Loading...' : raffleDetails?.title || 'Raffle Tickets'}
              </h1>
              <p className="text-gray-600">
                {ticketStats.total} ticket{ticketStats.total !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Refresh button */}
            <div className="ml-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRefresh}
                isLoading={isLoading && hasInitialFetch}
                disabled={isLoading}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {!isLoading && !error && tickets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Ticket className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unrevealed</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {ticketStats.unrevealed}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Revealed</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {ticketStats.revealed}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prizes Won</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {ticketStats.discovered + ticketStats.claimed}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content with State Handling */}
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {isLoading && !hasInitialFetch && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading tickets...</p>
            </motion.div>
          )}

          {/* Error State */}
          {!isLoading && (error || raffleError) && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-lg shadow-sm p-6 text-center"
            >
              <div className="flex flex-col items-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unable to Load Tickets
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {error || raffleError || "There was a problem loading your tickets."}
                </p>
                <Button
                  variant="primary"
                  onClick={handleRefresh}
                  isLoading={isLoading}
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && !error && !raffleError && tickets.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-lg shadow-sm p-8 text-center"
            >
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-gray-100 p-3 mb-4">
                  <Ticket className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Tickets Found
                </h3>
                <p className="text-gray-500 mb-6">
                  You don't have any tickets for this raffle.
                </p>
                <Button 
                  variant="primary"
                  onClick={handleBackToMyTickets}
                >
                  Back to My Tickets
                </Button>
              </div>
            </motion.div>
          )}

          {/* Ticket Grid */}
          {!isLoading && !error && !raffleError && tickets.length > 0 && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <TicketGridComponent 
                tickets={adaptedTickets}
                raffleName={raffleDetails?.title || ''}
                raffleEndDate={raffleDetails?.end_date || ''}
                onReveal={handleRevealTicket}
                onDiscover={handleDiscoverPrize}
                onClaim={handleClaimPrize}
                operations={new Map(Object.entries(processingTickets || {}))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FeatureErrorBoundary>
  );
};

export default RaffleTicketsPage;