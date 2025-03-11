import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  Gift, 
  Trophy, 
  CheckCircle, 
  ChevronRight, 
  ChevronDown
} from 'lucide-react';
// Direct import of our ticket card component
import TicketCardComponent from './TicketCard';

// Define the core ticket data structure based on backend response
export interface TicketData {
  id: string;
  ticket_id: string;
  ticket_number: string;
  raffle_id: number;
  raffle_title: string;
  user_id: number;
  status: string;
  is_revealed: boolean;
  instant_win_eligible: boolean;
  purchase_time: string;
  reveal_time: string | null;
  reveal_sequence: number | null;
  transaction_id: number | null;
  created_at: string;
  discovered_prize?: any;
  claim_status?: any;
}

// Group tickets by raffle
interface RaffleGroup {
  raffleId: number;
  raffleName: string;
  endDate: string;
  tickets: TicketData[];
}

interface TicketGridComponentProps {
  tickets: TicketData[];
  raffleName: string;
  raffleEndDate: string;
  onReveal: (ticketId: string) => Promise<void>;
  onDiscover: (ticketId: string) => Promise<void>;
  onClaim: (ticketId: string, prizeId: string) => Promise<void>;
  operations: Map<string, any>;
  className?: string;
}

/**
 * TicketGridComponent
 * 
 * Displays a grid of tickets with interactive elements for revealing,
 * discovering prizes, and claiming prizes. Implements the ticket grid 
 * design pattern with proper animations and state management.
 */
const TicketGridComponent: React.FC<TicketGridComponentProps> = ({
  tickets,
  raffleName,
  raffleEndDate,
  onReveal,
  onDiscover,
  onClaim,
  operations,
  className = ''
}) => {
  const [ticketGroups, setTicketGroups] = useState<RaffleGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  // Initialize with the tickets grouped by raffle
  useEffect(() => {
    if (tickets && tickets.length > 0) {
      const group: RaffleGroup = {
        raffleId: tickets[0].raffle_id,
        raffleName,
        endDate: raffleEndDate,
        tickets: tickets
      };
      
      setTicketGroups([group]);
      
      // Initialize as expanded
      setExpandedGroups(prev => ({
        ...prev,
        [group.raffleId]: true
      }));
    }
  }, [tickets, raffleName, raffleEndDate]);

  // Check if a ticket is currently being processed
  const isTicketProcessing = useCallback((ticketId: string) => {
    const operation = operations.get(ticketId);
    return operation && (operation.status === 'pending' || operation.status === 'processing');
  }, [operations]);

  // Initialize expanded state for all groups
  useEffect(() => {
    const initialExpanded = ticketGroups.reduce((acc, group) => {
      acc[group.raffleId] = true; // Start expanded by default
      return acc;
    }, {} as Record<number, boolean>);
    
    setExpandedGroups(initialExpanded);
  }, []);

  // Toggle group expansion
  const toggleGroup = (raffleId: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [raffleId]: !prev[raffleId]
    }));
  };

  // Calculate days remaining for a raffle
  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Format date to human-readable format
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle ticket reveal
  const handleRevealTicket = async (ticketId: string) => {
    setIsProcessing(prev => ({ ...prev, [ticketId]: true }));
    
    try {
      await onReveal(ticketId);
    } finally {
      setIsProcessing(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  // Handle prize discovery
  const handleDiscoverPrize = async (ticketId: string) => {
    setIsProcessing(prev => ({ ...prev, [ticketId]: true }));
    
    try {
      await onDiscover(ticketId);
    } finally {
      setIsProcessing(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  // Handle prize claim
  const handleClaimPrize = async (ticketId: string, prizeId: string) => {
    setIsProcessing(prev => ({ ...prev, [ticketId]: true }));
    
    try {
      await onClaim(ticketId, prizeId);
    } finally {
      setIsProcessing(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  // Calculate stats for summary display
  const ticketStats = useMemo(() => {
    const allTickets = tickets || [];
    
    const totalTickets = allTickets.length;
    const unrevealedTickets = allTickets.filter(t => !t.is_revealed).length;
    const prizesWon = allTickets.filter(t => 
      t.is_revealed && 
      t.discovered_prize
    ).length;

    return { totalTickets, unrevealedTickets, prizesWon };
  }, [tickets]);

  return (
    <div className={`max-w-6xl mx-auto p-4 space-y-6 ${className}`}>
      <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
      
      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-full">
            <Ticket className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Tickets</p>
            <p className="text-xl font-bold text-gray-900">
              {ticketStats.totalTickets}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3">
          <div className="p-2 bg-amber-100 rounded-full">
            <Gift className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Unrevealed</p>
            <p className="text-xl font-bold text-gray-900">
              {ticketStats.unrevealedTickets}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Trophy className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Prizes Won</p>
            <p className="text-xl font-bold text-gray-900">
              {ticketStats.prizesWon}
            </p>
          </div>
        </div>
      </div>
      
      {/* Ticket groups */}
      <div className="space-y-6">
        {ticketGroups.map(group => (
          <div key={group.raffleId} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Group header */}
            <div 
              className="p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer"
              onClick={() => toggleGroup(group.raffleId)}
            >
              <div>
                <h2 className="font-semibold text-gray-900">{group.raffleName}</h2>
                <p className="text-sm text-gray-500">
                  {group.tickets.length} tickets • 
                  {getDaysRemaining(group.endDate) > 0 
                    ? ` ${getDaysRemaining(group.endDate)} days remaining` 
                    : ' Ended'}
                </p>
              </div>
              <motion.div
                animate={{ rotate: expandedGroups[group.raffleId] ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </motion.div>
            </div>
            
            {/* Tickets grid */}
            <AnimatePresence>
              {expandedGroups[group.raffleId] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.tickets.map(ticket => (
                      <div key={ticket.ticket_id} className="h-[200px]">
                        {/* Use our new TicketCardComponent */}
                        <TicketCardComponent
                          ticket={ticket}
                          isProcessing={isProcessing[ticket.ticket_id] || isTicketProcessing(ticket.ticket_id)}
                          onReveal={() => handleRevealTicket(ticket.ticket_id)}
                          onDiscover={() => handleDiscoverPrize(ticket.ticket_id)}
                          onClaim={(prizeId) => handleClaimPrize(ticket.ticket_id, prizeId)}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketGridComponent;