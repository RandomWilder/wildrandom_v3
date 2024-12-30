// src/components/raffles/admin/tabs/RaffleTicketsTab.tsx

import { useEffect, useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { useRaffleStore } from '@/stores/raffleStore';
import { TICKET_STATUS_META } from '@/types/raffles/tickets';
import type { TicketStatus, TicketFilter } from '@/types/raffles';
import { formatDate } from '@/utils/date';

interface RaffleTicketsTabProps {
  raffleId: number;
}

// Derive status options from our type system to ensure type safety
const STATUS_OPTIONS = Object.keys(TICKET_STATUS_META) as TicketStatus[];

export const RaffleTicketsTab: React.FC<RaffleTicketsTabProps> = ({ raffleId }) => {
  const {
    tickets,
    totalTickets,
    isLoadingTickets,
    ticketError,
    loadTickets,
    updateTicketFilters
  } = useRaffleStore();

    // Local state for filters using proper types
    const [filters, setFilters] = useState<TicketFilter>({});
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

   // Load initial data
   useEffect(() => {
    loadTickets(raffleId);
  }, [raffleId, loadTickets]);

   // Handle filter application with type-safe implementation
   useEffect(() => {
    const timer = setTimeout(() => {
      // Create a new filter object with only valid filter properties
      const newFilters: TicketFilter = {
        ...filters,
        user_id: filters.user_id,
        status: filters.status,
        revealed: filters.revealed,
        instant_win: filters.instant_win,
        limit: filters.limit
      };

      // Apply filters and reload tickets
      updateTicketFilters(newFilters);
      loadTickets(raffleId);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, raffleId, updateTicketFilters, loadTickets]);

  // Type-safe statistics calculation
  const stats = useMemo(() => {
    return tickets.reduce((acc, ticket) => {
      // Ensure we only track valid ticket statuses
      const status = ticket.status as TicketStatus;
      return {
        ...acc,
        [status]: (acc[status] || 0) + 1,
        revealed: ticket.is_revealed ? (acc.revealed || 0) + 1 : (acc.revealed || 0),
        instantWinEligible: ticket.instant_win_eligible ? 
          (acc.instantWinEligible || 0) : (acc.instantWinEligible || 0)
      };
    }, {} as Record<string, number>);
  }, [tickets]);

  // Handle search separately from filter state
  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
    // Update relevant filters based on search
    // Note: We don't use a 'search' property as it's not in our TicketFilter type
    if (query) {
      // Implement search through supported filter parameters
      const numericQuery = parseInt(query);
      if (!isNaN(numericQuery)) {
        setFilters(prev => ({ ...prev, user_id: numericQuery }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {totalTickets.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Revealed</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {(stats.revealed || 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Instant Win Eligible</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {(stats.instantWinEligible || 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Sold</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {(stats['sold'] || 0).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={localSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by user ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {localSearchQuery && (
            <button
              onClick={() => {
                setLocalSearchQuery('');
                setFilters(prev => ({ ...prev, user_id: undefined }));
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2
                       text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  status: e.target.value as TicketStatus || undefined
                }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>
                    {TICKET_STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revealed
              </label>
              <select
                value={filters.revealed?.toString() || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  revealed: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Revealed</option>
                <option value="false">Not Revealed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instant Win
              </label>
              <select
                value={filters.instant_win?.toString() || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  instant_win: e.target.value === '' ? undefined : e.target.value === 'true'
                }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Eligible</option>
                <option value="false">Not Eligible</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Tickets Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instant Win
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revealed
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingTickets ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No tickets found matching the current filters
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr key={ticket.ticket_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ticket.ticket_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${ticket.status === 'sold' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'revealed' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.user_id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 rounded text-xs
                        ${ticket.instant_win_eligible ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                        {ticket.instant_win_eligible ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {ticket.is_revealed ? (
                        <span className="text-purple-600">{formatDate(ticket.reveal_time!)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {ticket.purchase_time ? formatDate(ticket.purchase_time) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};