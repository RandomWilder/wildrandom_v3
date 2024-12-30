// src/components/pools/PoolViews.tsx
import { useState, useMemo, useCallback } from 'react';
import { 
  LayoutGrid, 
  List, 
  Search,
  ArrowUp,
  ArrowDown,
  PackageOpen,
  Lock,
  Unlock,
  X,
  Trophy,
  AlertCircle
} from 'lucide-react';
import type { 
  PrizePool, 
  PoolStatus, 
  PoolMetrics,
  PoolValues
} from '@/types/pools';
import { POOL_STATUS_META } from '@/types/pools';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { Card } from '@/components/ui/card';

// View Types
type ViewMode = 'grid' | 'table';
type SortField = keyof PrizePool | 'values.retail_total' | 'values.cash_total' | 'values.credit_total';
type SortDirection = 'asc' | 'desc';

// Component Props
interface PoolViewsProps {
  pools: PrizePool[];
  onPoolClick: (pool: PrizePool) => void;
  onLockPool?: (pool: PrizePool) => void;
}

// Column Configuration
interface ColumnConfig {
  field: SortField;
  label: string;
  sortable: boolean;
  align: 'left' | 'right' | 'center';
  render?: (value: any, pool: PrizePool) => React.ReactNode;
}

// Status Icons mapping
const StatusIcon: Record<PoolStatus, typeof Lock> = {
  unlocked: Unlock,
  locked: Lock,
  used: PackageOpen
};

/**
 * Column Definitions
 * Matches backend data structure and presentation requirements
 */
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
      field: 'name',
      label: 'NAME',
      sortable: true,
      align: 'left'
    },
    {
      field: 'status',
      label: 'STATUS',
      sortable: true,
      align: 'left',
      render: (value: PoolStatus) => (
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${POOL_STATUS_META[value].bgColor} ${POOL_STATUS_META[value].color}
        `}>
          {POOL_STATUS_META[value].label}
        </span>
      )
    },
    {
      field: 'total_instances',
      label: 'TOTAL INSTANCES',
      sortable: true,
      align: 'right',
      render: (_, pool: PrizePool) => (
        <div className="text-right">
          <div>{pool.total_instances}</div>
          <div className="text-xs text-gray-500">
            IW: {pool.instant_win_instances} | DW: {pool.draw_win_instances}
          </div>
        </div>
      )
    },
    {
      field: 'values.retail_total',
      label: 'TOTAL VALUE',
      sortable: true,
      align: 'right',
      render: (_, pool: PrizePool) => (
        <div className="text-right">
          <div>{formatCurrency(pool.values.retail_total)}</div>
          <div className="text-xs text-gray-500">
            Cash: {formatCurrency(pool.values.cash_total)} |{' '}
            Credit: {formatCurrency(pool.values.credit_total)}
          </div>
        </div>
      )
    },
    {
      field: 'total_odds',
      label: 'TOTAL ODDS',
      sortable: true,
      align: 'right',
      render: (value) => `${value.toFixed(1)}%`
    },
    {
      field: 'created_at',
      label: 'CREATED',
      sortable: true,
      align: 'right',
      render: (value) => formatDate(value)
    }
  ];
  
  /**
   * Utility Functions
   * Implements business logic matching Python backend
   */
  const calculatePoolMetrics = (pools: PrizePool[]): PoolMetrics => {
    const initialValues: PoolValues = {
      retail_total: 0,
      cash_total: 0,
      credit_total: 0
    };
  
    return pools.reduce((acc, pool) => ({
      totalPools: acc.totalPools + 1,
      totalInstances: {
        total: acc.totalInstances.total + pool.total_instances,
        instantWin: acc.totalInstances.instantWin + pool.instant_win_instances,
        drawWin: acc.totalInstances.drawWin + pool.draw_win_instances
      },
      totalValues: {
        retail_total: acc.totalValues.retail_total + pool.values.retail_total,
        cash_total: acc.totalValues.cash_total + pool.values.cash_total,
        credit_total: acc.totalValues.credit_total + pool.values.credit_total
      },
      statusCounts: {
        ...acc.statusCounts,
        [pool.status]: (acc.statusCounts[pool.status] || 0) + 1
      }
    }), {
      totalPools: 0,
      totalInstances: { total: 0, instantWin: 0, drawWin: 0 },
      totalValues: initialValues,
      statusCounts: {} as Record<PoolStatus, number>
    });
  };
  
  const getNestedValue = (pool: PrizePool, field: SortField): any => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.') as [keyof PrizePool, keyof PoolValues];
      return (pool[parent] as PoolValues)?.[child];
    }
    return pool[field as keyof PrizePool];
  };

/**
 * Pool Card Component
 * Displays individual pool in grid view
 */
interface PoolCardProps {
    pool: PrizePool;
    onPoolClick: (pool: PrizePool) => void;
    onLockPool?: (pool: PrizePool) => void;
  }
  
  const PoolCard: React.FC<PoolCardProps> = ({ pool, onPoolClick, onLockPool }) => {
    return (
      <Card
        key={pool.id}
        onClick={() => onPoolClick(pool)}
        className="hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
      >
        <div className="p-6">
          {/* Header with Pool ID and Status */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              Pool ID: <span className="font-mono">{pool.id}</span>
            </span>
            <span className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${POOL_STATUS_META[pool.status].bgColor} 
              ${POOL_STATUS_META[pool.status].color}
            `}>
              {POOL_STATUS_META[pool.status].label}
            </span>
          </div>
  
          {/* Pool Name and Description */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {pool.name}
            </h3>
            {pool.description && (
              <p className="mt-1 text-sm text-gray-500">{pool.description}</p>
            )}
          </div>
  
          {/* Instance Counts */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Instant Win</p>
              <p className="text-lg font-medium">{pool.instant_win_instances}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Draw Win</p>
              <p className="text-lg font-medium">{pool.draw_win_instances}</p>
            </div>
          </div>
  
          {/* Value Information */}
          <div className="space-y-2">
            {[
              { label: 'Retail Value', value: pool.values.retail_total },
              { label: 'Cash Value', value: pool.values.cash_total },
              { label: 'Credit Value', value: pool.values.credit_total }
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
  
          {/* Metadata Footer */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Odds</span>
                <p className="font-medium">{pool.total_odds.toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-gray-500">Created</span>
                <p className="font-medium">{formatDate(pool.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
  
        {/* Lock Action Overlay */}
        {pool.status === 'unlocked' && onLockPool && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 
                     flex items-center justify-center opacity-0 hover:opacity-100
                     transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onLockPool(pool);
            }}
          >
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg
                       hover:bg-indigo-700 transition-colors"
              disabled={pool.total_odds !== 100 || pool.draw_win_instances === 0}
              title={
                pool.total_odds !== 100
                  ? 'Total odds must equal 100%'
                  : pool.draw_win_instances === 0
                  ? 'At least one draw win prize is required'
                  : 'Lock pool'
              }
            >
              <Lock className="w-5 h-5 mr-2 inline-block" />
              Lock Pool
            </button>
          </div>
        )}
      </Card>
    );
  };
  
  /**
   * Table Header Component
   * Renders sortable column headers
   */
  interface TableHeaderProps {
    column: ColumnConfig;
    sortConfig: { field: SortField; direction: SortDirection };
    onSort: (field: SortField) => void;
  }
  
  const TableHeader: React.FC<TableHeaderProps> = ({ column, sortConfig, onSort }) => (
    <th
      key={column.field}
      scope="col"
      className={`
        px-6 py-3 text-${column.align} text-xs font-medium text-gray-500 
        uppercase tracking-wider ${column.sortable ? 'cursor-pointer' : ''}
        whitespace-nowrap
      `}
      onClick={() => column.sortable && onSort(column.field)}
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
  );
  
  /**
   * Table Row Component
   * Renders individual pool data row
   */
  interface TableRowProps {
    pool: PrizePool;
    onPoolClick: (pool: PrizePool) => void;
    onLockPool?: (pool: PrizePool) => void;
  }
  
  const TableRow: React.FC<TableRowProps> = ({ pool, onPoolClick, onLockPool }) => (
    <tr 
      key={pool.id}
      onClick={() => onPoolClick(pool)}
      className="hover:bg-gray-50 cursor-pointer"
    >
      {COLUMNS.map((column) => (
        <td
          key={column.field}
          className={`
            px-6 py-4 whitespace-nowrap text-sm
            ${column.align === 'right' ? 'text-right' : ''}
          `}
        >
          {column.render 
            ? column.render(
                column.field.includes('.')
                  ? column.field.split('.').reduce((obj, key) => obj[key], pool as any)
                  : pool[column.field as keyof PrizePool],
                pool
              )
            : String(pool[column.field as keyof PrizePool])}
        </td>
      ))}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {pool.status === 'unlocked' && onLockPool && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLockPool(pool);
            }}
            className="inline-flex items-center px-3 py-1.5 rounded-md
                     text-indigo-600 hover:text-indigo-900
                     hover:bg-indigo-50 transition-colors"
            disabled={pool.total_odds !== 100 || pool.draw_win_instances === 0}
            title={
              pool.total_odds !== 100
                ? 'Total odds must equal 100%'
                : pool.draw_win_instances === 0
                ? 'At least one draw win prize is required'
                : 'Lock pool'
            }
          >
            <Lock className="w-4 h-4 mr-1" />
            Lock Pool
          </button>
        )}
      </td>
    </tr>
  );

  /**
 * Main PoolViews Component
 * Implements comprehensive pool management UI with strict type safety
 */
export function PoolViews({ pools, onPoolClick, onLockPool }: PoolViewsProps) {
    // State Management
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [sortConfig, setSortConfig] = useState<{field: SortField; direction: SortDirection}>({
      field: 'created_at',
      direction: 'desc'
    });
    const [searchQuery, setSearchQuery] = useState('');
  
    // Memoized Calculations
    const metrics = useMemo(() => calculatePoolMetrics(pools), [pools]);
  
    const handleSort = useCallback((field: SortField) => {
      setSortConfig(current => ({
        field,
        direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
      }));
    }, []);
  
    // Data Processing with Memoization
    const processedPools = useMemo(() => {
      let result = [...pools];
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(pool => 
          pool.name.toLowerCase().includes(query) ||
          pool.id.toString().includes(query) ||
          pool.description?.toLowerCase().includes(query)
        );
      }
      
      return result.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.field);
        const bValue = getNestedValue(b, sortConfig.field);
  
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
  
        return sortConfig.direction === 'asc'
          ? (Number(aValue) - Number(bValue))
          : (Number(bValue) - Number(aValue));
      });
    }, [pools, searchQuery, sortConfig]);
  
    // Render Sub-components
    const ViewToggle = useCallback(() => (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-indigo-100 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Grid View"
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
            title="Table View"
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
            placeholder="Search pools..."
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
    ), [viewMode, searchQuery]);
  
    const MetricsDisplay = useCallback(() => (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard 
          title="Total Pools" 
          value={metrics.totalPools.toString()} 
        />
        <MetricCard
          title="Total Instances"
          value={metrics.totalInstances.total.toString()}
          subtitle={`IW: ${metrics.totalInstances.instantWin} | DW: ${metrics.totalInstances.drawWin}`}
        />
        <MetricCard
          title="Total Value"
          value={formatCurrency(metrics.totalValues.retail_total)}
          subtitle="Combined retail value"
        />
        <StatusMetricCard 
          statusCounts={metrics.statusCounts} 
        />
      </div>
    ), [metrics]);

     /**
   * Reusable Metric Card Components
   */
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

  const StatusMetricCard = useCallback(({ statusCounts }: {
    statusCounts: Record<PoolStatus, number>;
  }) => (
    <Card className="p-4">
      <p className="text-sm text-gray-500">Pool Status</p>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {(Object.keys(POOL_STATUS_META) as PoolStatus[]).map(status => (
          <div
            key={status}
            className={`text-center p-1 rounded ${POOL_STATUS_META[status].bgColor}`}
          >
            <p className={`text-sm ${POOL_STATUS_META[status].color} font-medium`}>
              {statusCounts[status] || 0}
            </p>
            <p className="text-xs text-gray-500">
              {status}
            </p>
          </div>
        ))}
      </div>
    </Card>
  ), []);

  /**
   * Grid View Implementation
   */
  const GridView = useCallback(() => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {processedPools.map((pool) => (
        <PoolCard
          key={pool.id}
          pool={pool}
          onPoolClick={onPoolClick}
          onLockPool={onLockPool}
        />
      ))}
    </div>
  ), [processedPools, onPoolClick, onLockPool]);

  /**
   * Table View Implementation
   */
  const TableView = useCallback(() => (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {COLUMNS.map((column) => (
              <TableHeader
                key={column.field}
                column={column}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            ))}
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {processedPools.map((pool) => (
            <TableRow
              key={pool.id}
              pool={pool}
              onPoolClick={onPoolClick}
              onLockPool={onLockPool}
            />
          ))}
        </tbody>
      </table>
    </div>
  ), [processedPools, sortConfig, handleSort, onPoolClick, onLockPool]);

  /**
   * Empty State Component
   */
  const EmptyState = useCallback(() => (
    <div className="text-center py-12">
      <PackageOpen className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No pools found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Get started by creating a new prize pool'}
      </p>
    </div>
  ), [searchQuery]);

  // Main render
  return (
    <div className="space-y-6">
      <ViewToggle />
      <MetricsDisplay />
      {processedPools.length > 0 
        ? viewMode === 'grid' 
          ? <GridView /> 
          : <TableView />
        : <EmptyState />
      }
    </div>
  );
}