import { useState, useMemo, useCallback } from 'react';
import { 
  LayoutGrid, 
  List, 
  Search,
  ArrowUp,
  ArrowDown,
  Ticket as TicketIcon,
  X,
  User,
  Clock
} from 'lucide-react';
import type { 
  Ticket, 
  TicketStatus 
} from '@/types/raffles';
import { TICKET_STATUS_META } from '@/types/raffles/tickets';
import { formatDate } from '@/utils/date';
import { Card } from '@/components/ui/card';
import { useRaffleStore } from '@/stores/raffleStore';
import { Badge } from '@/components/ui/badge';

// View Types
type ViewMode = 'grid' | 'table';
type SortField = keyof Ticket;
type SortDirection = 'asc' | 'desc';

interface TicketListProps {
  tickets: Ticket[];
  totalTickets: number;
  isLoading: boolean;
}

// Column Configuration
interface ColumnConfig {
  field: SortField;
  label: string;
  sortable: boolean;
  align: 'left' | 'right' | 'center';
  render?: (value: any, ticket: Ticket) => React.ReactNode;
}

// Define columns with proper typing
const COLUMNS: ColumnConfig[] = [
  {
    field: 'ticket_id',
    label: 'TICKET ID',
    sortable: true,
    align: 'left',
    render: (value) => (
      <span className="font-mono">{value}</span>
    )
  },
  {
    field: 'status',
    label: 'STATUS',
    sortable: true,
    align: 'left',
    render: (value: TicketStatus) => (
      <Badge variant="outline" className={`
        ${TICKET_STATUS_META[value].bgColor}
        ${TICKET_STATUS_META[value].color}
      `}>
        {TICKET_STATUS_META[value].label}
      </Badge>
    )
  },
  {
    field: 'user_id',
    label: 'OWNER',
    sortable: true,
    align: 'left',
    render: (value) => value ? (
      <span className="flex items-center">
        <User className="w-4 h-4 mr-1" />
        ID: {value}
      </span>
    ) : '-'
  },
  {
    field: 'instant_win_eligible',
    label: 'INSTANT WIN',
    sortable: true,
    align: 'center',
    render: (value) => (
      <span className={`px-2 py-1 rounded text-xs ${
        value 
          ? 'bg-green-50 text-green-700'
          : 'bg-gray-50 text-gray-700'
      }`}>
        {value ? 'Yes' : 'No'}
      </span>
    )
  },
  {
    field: 'is_revealed',
    label: 'REVEALED',
    sortable: true,
    align: 'center',
    render: (value, ticket) => (
      <div className="text-center">
        <span className={`px-2 py-1 rounded text-xs ${
          value
            ? 'bg-purple-50 text-purple-700'
            : 'bg-gray-50 text-gray-700'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
        {value && ticket.reveal_time && (
          <div className="text-xs text-gray-500 mt-1">
            {formatDate(ticket.reveal_time)}
          </div>
        )}
      </div>
    )
  },
  {
    field: 'created_at',
    label: 'CREATED',
    sortable: true,
    align: 'right',
    render: (value) => formatDate(value)
  }
];

// TicketCard Component for Grid View
const TicketCard: React.FC<{
  ticket: Ticket;
}> = ({ ticket }) => (
  <Card className="hover:shadow-md transition-shadow">
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-sm">
          {ticket.ticket_id}
        </span>
        <Badge variant="outline" className={`
          ${TICKET_STATUS_META[ticket.status].bgColor}
          ${TICKET_STATUS_META[ticket.status].color}
        `}>
          {TICKET_STATUS_META[ticket.status].label}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Instant Win</p>
            <p className="font-medium">{ticket.instant_win_eligible ? 'Yes' : 'No'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Revealed</p>
            <p className="font-medium">{ticket.is_revealed ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {ticket.user_id && (
          <div className="flex items-center text-sm">
            <User className="w-4 h-4 mr-2" />
            <span>Owner ID: {ticket.user_id}</span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-2" />
          <span>{formatDate(ticket.created_at)}</span>
        </div>
      </div>
    </div>
  </Card>
);

// Main TicketList Component
export function TicketList({ tickets, totalTickets, isLoading }: TicketListProps) {
  // Local State
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortConfig, setSortConfig] = useState<{field: SortField; direction: SortDirection}>({
    field: 'created_at',
    direction: 'desc'
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Store Access
  const { ticketFilters, updateTicketFilters } = useRaffleStore();

  // Sorting Handler
  const handleSort = useCallback((field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Process and sort tickets
  const processedTickets = useMemo(() => {
    let result = [...tickets];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ticket => 
        ticket.ticket_id.toLowerCase().includes(query) ||
        ticket.ticket_number.toLowerCase().includes(query)
      );
    }
    
    return result.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortConfig.direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      return sortConfig.direction === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [tickets, searchQuery, sortConfig]);

  // Status filter counts
  const statusCounts = useMemo(() => 
    tickets.reduce((acc, ticket) => ({
      ...acc,
      [ticket.status]: (acc[ticket.status] || 0) + 1
    }), {} as Record<TicketStatus, number>)
  , [tickets]);

  return (
    <div className="space-y-6">
      {/* View Toggle & Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2
                       text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(TICKET_STATUS_META).map(([status, meta]) => (
          <Card key={status} className="p-4">
            <p className="text-sm text-gray-500">{meta.label} Tickets</p>
            <p className="text-2xl font-semibold">
              {statusCounts[status as TicketStatus] || 0}
            </p>
          </Card>
        ))}
      </div>

      {/* Ticket Grid/Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {processedTickets.map(ticket => (
            <TicketCard
              key={ticket.ticket_id}
              ticket={ticket}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {COLUMNS.map(column => (
                  <th
                    key={column.field}
                    className={`
                      px-6 py-3 text-${column.align} text-xs font-medium text-gray-500 
                      uppercase tracking-wider ${column.sortable ? 'cursor-pointer' : ''}
                    `}
                    onClick={() => column.sortable && handleSort(column.field)}
                  >
                    <div className="flex items-center space-x-1 justify-between">
                      <span>{column.label}</span>
                      {column.sortable && sortConfig.field === column.field && (
                        sortConfig.direction === 'asc'
                          ? <ArrowUp className="h-4 w-4" />
                          : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedTickets.map(ticket => (
                <tr key={ticket.ticket_id} className="hover:bg-gray-50">
                  {COLUMNS.map(column => (
                    <td
                      key={column.field}
                      className={`
                        px-6 py-4 whitespace-nowrap text-sm
                        ${column.align === 'right' ? 'text-right' : ''}
                        ${column.align === 'center' ? 'text-center' : ''}
                      `}
                    >
                      {column.render
                        ? column.render(ticket[column.field], ticket)
                        : String(ticket[column.field])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {processedTickets.length === 0 && (
        <div className="text-center py-12">
          <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'No tickets match the current filters'}
          </p>
        </div>
      )}
    </div>
  );
}