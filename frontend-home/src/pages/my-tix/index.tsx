// src/pages/my-tix/index.tsx

import { FC, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useTicketGroups } from '../../hooks/useTicketGroups';
import { FeatureErrorBoundary } from '../../components/common/ErrorBoundary';
import {
  Loader,
  RefreshCw,
  AlertTriangle,
  Ticket,
  Timer,
  Trophy
} from '../../components/common/icons';
import type { TicketGroup } from '../../api/types/ticketGroups';

/**
 * MyTixPage Component
 * 
 * Displays the user's tickets grouped by raffle, with proper data fetching,
 * state management, and interactive elements that match the original my-tickets
 * implementation.
 */
const MyTixPage: FC = () => {
  const navigate = useNavigate();
  const { groups, isLoading, error, fetchGroups } = useTicketGroups();
  const [selectedRaffleId, setSelectedRaffleId] = useState<number | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState<boolean>(false);
  const initialFetchDone = useRef(false);

  // Fetch data on component mount
  useEffect(() => {
    if (!initialFetchDone.current) {
      console.log("Initial tickets fetch triggered");
      fetchGroups(true)
        .then(() => {
          initialFetchDone.current = true;
        })
        .catch(error => {
          console.error("Error fetching ticket groups:", error);
        });
    }
  }, [fetchGroups]);

  // Sort groups by active status and unrevealed tickets
  const sortedGroups = useMemo(() => {
    if (!groups || groups.length === 0) return [];
    
    return [...groups].sort((a, b) => {
      // Active raffles first
      const aIsActive = a.raffle_state === 'open' || (a.time_remaining?.seconds_to_end > 0);
      const bIsActive = b.raffle_state === 'open' || (b.time_remaining?.seconds_to_end > 0);
      
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
      // Then by unrevealed tickets (more first)
      if (a.unrevealed_tickets !== b.unrevealed_tickets) {
        return b.unrevealed_tickets - a.unrevealed_tickets;
      }
      
      // Then by end time (most urgent first)
      return (a.time_remaining?.seconds_to_end || 0) - (b.time_remaining?.seconds_to_end || 0);
    });
  }, [groups]);

  // Compute summary statistics
  const stats = useMemo(() => {
    if (!sortedGroups.length) return { totalTickets: 0, unrevealedTickets: 0, activeRaffles: 0 };
    
    return {
      totalTickets: sortedGroups.reduce((sum, group) => sum + group.total_tickets, 0),
      unrevealedTickets: sortedGroups.reduce((sum, group) => sum + group.unrevealed_tickets, 0),
      activeRaffles: sortedGroups.filter(group => 
        group.raffle_state === 'open' || (group.time_remaining?.seconds_to_end || 0) > 0
      ).length
    };
  }, [sortedGroups]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    try {
      await fetchGroups(true);
    } catch (err) {
      console.error('Failed to refresh tickets:', err);
    }
  }, [fetchGroups]);

  // Handle ticket group selection
  const handleGroupSelect = useCallback((raffleId: number) => {
    console.log(`Navigating to raffle tickets: ${raffleId}`);
    // Set state for potential local operations
    setSelectedRaffleId(raffleId);
    setShowTicketDetails(true);
    // Navigate to the raffle tickets page
    navigate(`/raffles/${raffleId}/tickets`);
  }, [navigate]);
  

  // Calculate render states
  const isEmpty = !isLoading && !error && (!groups || groups.length === 0);
  const hasGroups = !isLoading && !error && sortedGroups.length > 0;
  const hasActiveGroups = hasGroups && sortedGroups.some(group => 
    group.raffle_state === 'open' || (group.time_remaining?.seconds_to_end || 0) > 0
  );
  const hasEndedGroups = hasGroups && sortedGroups.some(group => 
    group.raffle_state !== 'open' && ((group.time_remaining?.seconds_to_end || 0) <= 0)
  );

  return (
    <FeatureErrorBoundary feature="My Tickets">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header with Refresh Button */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Tickets
            </h1>
            <p className="mt-1 text-gray-600">
              Manage your raffle tickets and check for prizes
            </p>
          </div>
          
          {hasGroups && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              isLoading={isLoading}
              disabled={isLoading}
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

        {/* Stats Summary - Only shown when has groups */}
        {hasGroups && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-full">
                  <Ticket className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tickets</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {stats.totalTickets}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unrevealed</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {stats.unrevealedTickets}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Timer className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Raffles</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {stats.activeRaffles}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content with State Handling */}
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {isLoading && !initialFetchDone.current && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading your tickets...</p>
            </motion.div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-6 text-center">
                <div className="flex flex-col items-center">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Unable to Load Tickets
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {error || "There was a problem loading your tickets. Please try again."}
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleRefresh}
                    isLoading={isLoading}
                  >
                    Try Again
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && !error && isEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <Ticket className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Tickets Found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Start your winning journey by exploring our active raffles.
                  </p>
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/')}
                  >
                    Explore Raffles
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Ticket Groups List */}
          {!isLoading && !error && hasGroups && (
            <div>
              {/* Active Raffles Section */}
              {hasActiveGroups && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Active Raffles</h2>
                  <motion.div
                    key="active-groups"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {sortedGroups
                      .filter(group => group.raffle_state === 'open' || (group.time_remaining?.seconds_to_end || 0) > 0)
                      .map(group => (
                        <GroupCard 
                          key={`group-${group.raffle_id}`}
                          group={group}
                          onSelect={() => handleGroupSelect(group.raffle_id)}
                        />
                      ))
                    }
                  </motion.div>
                </div>
              )}

              {/* Ended Raffles Section */}
              {hasEndedGroups && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Past Raffles</h2>
                  <motion.div
                    key="ended-groups"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {sortedGroups
                      .filter(group => group.raffle_state !== 'open' && ((group.time_remaining?.seconds_to_end || 0) <= 0))
                      .map(group => (
                        <GroupCard 
                          key={`group-${group.raffle_id}`}
                          group={group}
                          onSelect={() => handleGroupSelect(group.raffle_id)}
                        />
                      ))
                    }
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </FeatureErrorBoundary>
  );
};

/**
 * GroupCard Component
 * 
 * Reusable card component for displaying ticket group information
 */
interface GroupCardProps {
  group: TicketGroup;
  onSelect: () => void;
}

const GroupCard: FC<GroupCardProps> = ({ group, onSelect }) => {
  const isActive = group.raffle_state === 'open' || (group.time_remaining?.seconds_to_end || 0) > 0;
  
  // Calculate reveal progress percentage safely
  const revealPercentage = useMemo(() => {
    if (!group.total_tickets) return 0;
    return ((group.total_tickets - group.unrevealed_tickets) / group.total_tickets) * 100;
  }, [group.total_tickets, group.unrevealed_tickets]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={onSelect}
      className="cursor-pointer transform transition-transform hover:scale-[1.01]"
    >
      <Card variant={group.unrevealed_tickets > 0 ? "featured" : "default"} className="overflow-hidden">
        <div className="p-4">
          {/* Group Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {group.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {group.total_tickets} tickets • 
                {isActive
                  ? ` Ends in ${group.time_remaining?.formatted_time_to_end || 'soon'}`
                  : ' Ended'}
              </p>
            </div>
            
            {group.unrevealed_tickets > 0 && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full flex items-center">
                <Ticket className="w-4 h-4 mr-1" />
                {group.unrevealed_tickets} unrevealed
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-1">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ 
                  width: `${revealPercentage}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>
                {Math.round(revealPercentage)}% revealed
              </span>
            </div>
          </div>
          
          {/* Prize notification for winners */}
          {group.participation_status?.has_winning_tickets && (
            <div className="mt-3 text-sm text-green-600 font-medium flex items-center">
              <Trophy className="w-4 h-4 mr-1" />
              Winning tickets available
            </div>
          )}
          
          {/* Action Indicator */}
          {group.card_metrics?.action_required && (
            <div className="mt-3 text-sm text-indigo-600 font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Action required
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default MyTixPage;