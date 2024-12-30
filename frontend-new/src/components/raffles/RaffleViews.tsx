// src/components/raffles/RaffleViews.tsx
import { useState, useMemo, useCallback } from 'react';
import { 
  LayoutGrid, 
  List, 
  Search,
  ArrowUp,
  ArrowDown,
  Ticket,
  X,
  Calendar
} from 'lucide-react';
import type { Raffle, RaffleStatus, RaffleState } from '@/types/raffles';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import RaffleStatusBadge from './shared/RaffleStatusBadge';
import RaffleStateChip from './shared/RaffleStateChip';

type ViewMode = 'grid' | 'table';
type SortField = keyof Raffle;
type SortDirection = 'asc' | 'desc';

interface RaffleViewsProps {
  raffles: Raffle[];
  onRaffleClick: (raffle: Raffle) => void;
}

interface ColumnConfig {
  field: SortField;
  label: string;
  sortable: boolean;
  align: 'left' | 'right' | 'center';
  render?: (value: any, raffle: Raffle) => React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  { 
    field: 'id',
    label: 'ID',
    sortable: true,
    align: 'left',
    render: (value) => (
      <span className="font-mono">{value}</span>
    )
  },
  { 
    field: 'title',
    label: 'TITLE',
    sortable: true,
    align: 'left'
  },
  {
    field: 'status',
    label: 'STATUS',
    sortable: true,
    align: 'left',
    render: (value: RaffleStatus, raffle: Raffle) => (
      <div className="flex items-center space-x-2">
        <RaffleStatusBadge status={value} />
        <RaffleStateChip state={raffle.state} />
      </div>
    )
  },
  {
    field: 'total_tickets',
    label: 'TICKETS',
    sortable: true,
    align: 'right',
    render: (value) => value.toLocaleString()
  },
  {
    field: 'ticket_price',
    label: 'PRICE',
    sortable: true,
    align: 'right',
    render: (value) => formatCurrency(value)
  },
  {
    field: 'start_time',
    label: 'STARTS',
    sortable: true,
    align: 'right',
    render: (value) => formatDate(value)
  },
  {
    field: 'end_time',
    label: 'ENDS',
    sortable: true,
    align: 'right',
    render: (value) => formatDate(value)
  }
];

// Calculate raffle metrics
const calculateRaffleMetrics = (raffles: Raffle[]) => {
  return raffles.reduce((acc, raffle) => ({
    totalRaffles: acc.totalRaffles + 1,
    totalTickets: acc.totalTickets + raffle.total_tickets,
    totalValue: acc.totalValue + (raffle.total_tickets * raffle.ticket_price),
    statusCounts: {
      ...acc.statusCounts,
      [raffle.status]: (acc.statusCounts[raffle.status] || 0) + 1
    }
  }), {
    totalRaffles: 0,
    totalTickets: 0,
    totalValue: 0,
    statusCounts: {} as Record<RaffleStatus, number>
  });
};

// Raffle Card Component
const RaffleCard: React.FC<{
  raffle: Raffle;
  onClick: (raffle: Raffle) => void;
}> = ({ raffle, onClick }) => (
  <Card
    onClick={() => onClick(raffle)}
    className="hover:shadow-md transition-shadow cursor-pointer"
  >
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          Raffle ID: <span className="font-mono">{raffle.id}</span>
        </span>
        <div className="flex items-center space-x-2">
          <RaffleStatusBadge status={raffle.status} />
          <RaffleStateChip state={raffle.state} />
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{raffle.title}</h3>
        {raffle.description && (
          <p className="mt-1 text-sm text-gray-500">{raffle.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Total Tickets</p>
          <p className="text-lg font-medium">{raffle.total_tickets.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Ticket Price</p>
          <p className="text-lg font-medium">{formatCurrency(raffle.ticket_price)}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Starts</span>
            <p className="font-medium">{formatDate(raffle.start_time)}</p>
          </div>
          <div>
            <span className="text-gray-500">Ends</span>
            <p className="font-medium">{formatDate(raffle.end_time)}</p>
          </div>
        </div>
      </div>
    </div>
  </Card>
);

// Main Component
export function RaffleViews({ raffles, onRaffleClick }: RaffleViewsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortConfig, setSortConfig] = useState<{field: SortField; direction: SortDirection}>({
    field: 'created_at',
    direction: 'desc'
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Memoized calculations
  const metrics = useMemo(() => calculateRaffleMetrics(raffles), [raffles]);

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Process and sort raffles
  const processedRaffles = useMemo(() => {
    let result = [...raffles];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(raffle => 
        raffle.title.toLowerCase().includes(query) ||
        raffle.id.toString().includes(query) ||
        raffle.description?.toLowerCase().includes(query)
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

      return sortConfig.direction === 'asc'
        ? ((aValue as number) - (bValue as number))
        : ((bValue as number) - (aValue as number));
    });
  }, [raffles, searchQuery, sortConfig]);

  // Component render functions
  const MetricCard = useCallback(({ title, value, subtitle }: {
    title: string;
    value: string;
    subtitle?: string;
  }) => (
    <Card className="p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </Card>
  ), []);

  return (
    <div className="space-y-6">
      {/* View Toggle & Search */}
      <div className="flex items-center justify-between mb-6">
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
            placeholder="Search raffles..."
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

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Raffles"
          value={metrics.totalRaffles.toString()}
        />
        <MetricCard
          title="Total Tickets"
          value={metrics.totalTickets.toLocaleString()}
        />
        <MetricCard
          title="Total Value"
          value={formatCurrency(metrics.totalValue)}
        />
        <Card className="p-4">
          <p className="text-sm text-gray-500">Status Overview</p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {Object.entries(metrics.statusCounts).map(([status, count]) => (
              <div key={status} className="text-center">
                <p className="text-sm font-medium">{count}</p>
                <p className="text-xs text-gray-500">{status}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Raffle List/Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {processedRaffles.map(raffle => (
            <RaffleCard
              key={raffle.id}
              raffle={raffle}
              onClick={onRaffleClick}
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
              {processedRaffles.map(raffle => (
                <tr
                  key={raffle.id}
                  onClick={() => onRaffleClick(raffle)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  {COLUMNS.map(column => (
                    <td
                      key={column.field}
                      className={`
                        px-6 py-4 whitespace-nowrap text-sm
                        ${column.align === 'right' ? 'text-right' : ''}
                      `}
                    >
                      {column.render
                        ? column.render(raffle[column.field], raffle)
                        : String(raffle[column.field])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {processedRaffles.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No raffles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Get started by creating a new raffle'}
          </p>
        </div>
      )}
    </div>
  );
}