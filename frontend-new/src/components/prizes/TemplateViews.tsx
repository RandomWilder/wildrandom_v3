import { useState, useMemo, useCallback } from 'react';
import { 
  LayoutGrid, 
  List, 
  Trophy,
  Search,
  ArrowUp,
  ArrowDown,
  Filter,
  X
} from 'lucide-react';
import type { PrizeTemplate, PrizeType, PrizeTier } from '@/types/prizes/models';
import { formatCurrency } from '@/utils/currency';

// View Types
type ViewMode = 'grid' | 'table';
type SortField = keyof PrizeTemplate | 'values.retail' | 'values.cash' | 'values.credit';
type SortDirection = 'asc' | 'desc';

// Props Interface
interface TemplateViewsProps {
  templates: PrizeTemplate[];
  onTemplateClick: (template: PrizeTemplate) => void;
}

// Column Configuration
interface ColumnConfig {
  field: SortField;
  label: string;
  sortable: boolean;
  align: 'left' | 'right' | 'center';
  render?: (value: any) => React.ReactNode;
}

// Sorting Interface
interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Define columns
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
    label: 'Name',
    sortable: true,
    align: 'left'
  },
  { 
    field: 'type',
    label: 'Type',
    sortable: true,
    align: 'left',
    render: (value: PrizeType) => 
      value === 'instant_win' ? 'Instant Win' : 'Draw Win'
  },
  { 
    field: 'tier',
    label: 'Tier',
    sortable: true,
    align: 'left',
    render: (value: PrizeTier) => (
      <span className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${TIER_STYLES[value].bg} ${TIER_STYLES[value].color}
      `}>
        {value.toUpperCase()}
      </span>
    )
  },
  { 
    field: 'values.retail',
    label: 'Retail Value',
    sortable: true,
    align: 'right',
    render: (value: number) => formatCurrency(value)
  },
  { 
    field: 'values.cash',
    label: 'Cash Value',
    sortable: true,
    align: 'right',
    render: (value: number) => formatCurrency(value)
  },
  { 
    field: 'values.credit',
    label: 'Credit Value',
    sortable: true,
    align: 'right',
    render: (value: number) => formatCurrency(value)
  },
  { 
    field: 'pools_count',
    label: 'Active Pools',
    sortable: true,
    align: 'right'
  }
];

export function TemplateViews({ templates, onTemplateClick }: TemplateViewsProps) {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'id', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Sort function
  const sortData = useCallback((data: PrizeTemplate[]): PrizeTemplate[] => {
    return [...data].sort((a, b) => {
      const aValue = sortConfig.field.includes('.')
        ? sortConfig.field.split('.').reduce((obj, key) => (obj as any)[key], a)
        : a[sortConfig.field as keyof PrizeTemplate];
      const bValue = sortConfig.field.includes('.')
        ? sortConfig.field.split('.').reduce((obj, key) => (obj as any)[key], b)
        : b[sortConfig.field as keyof PrizeTemplate];

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      }
      
      return sortConfig.direction === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [sortConfig]);

  // Search function
  const filterData = useCallback((data: PrizeTemplate[]): PrizeTemplate[] => {
    if (!searchQuery) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(template => 
      template.name.toLowerCase().includes(query) ||
      template.id.toString().includes(query) ||
      template.type.toLowerCase().includes(query) ||
      template.tier.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Memoized filtered and sorted data
  const processedTemplates = useMemo(() => {
    let result = filterData(templates);
    result = sortData(result);
    return result;
  }, [templates, filterData, sortData]);

  // View toggle component
  const ViewToggle = () => (
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
          placeholder="Search templates..."
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
  );

  // Grid view component
  const GridView = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {processedTemplates.map((template) => (
        <div
          key={template.id}
          onClick={() => onTemplateClick(template)}
          className="bg-white rounded-lg border border-gray-200 shadow-sm 
                   hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Template ID: <span className="font-mono">{template.id}</span>
              </span>
              <Trophy className={`
                h-5 w-5 
                ${template.type === 'instant_win' ? 'text-amber-500' : 'text-purple-500'}
              `} />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {template.name}
              </h3>
              <span className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${TIER_STYLES[template.tier].bg} ${TIER_STYLES[template.tier].color}
              `}>
                {template.tier.toUpperCase()}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Retail Value</span>
                <span className="font-medium">
                  {formatCurrency(template.values.retail)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cash Value</span>
                <span className="font-medium">
                  {formatCurrency(template.values.cash)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Credit Value</span>
                <span className="font-medium">
                  {formatCurrency(template.values.credit)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Active Pools</span>
                <span className="font-medium">{template.pools_count}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Total Instances</span>
                <span className="font-medium">{template.total_instances}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Table view component
  const TableView = () => (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.field}
                scope="col"
                className={`
                  px-6 py-3 text-${column.align} text-xs font-medium text-gray-500 
                  uppercase tracking-wider ${column.sortable ? 'cursor-pointer' : ''}
                  whitespace-nowrap
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
          {processedTemplates.map((template) => (
            <tr 
              key={template.id}
              onClick={() => onTemplateClick(template)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              {COLUMNS.map((column) => {
                const value = column.field.includes('.')
                  ? column.field.split('.').reduce((obj, key) => (obj as any)[key], template)
                  : template[column.field as keyof PrizeTemplate];

                return (
                  <td
                    key={column.field}
                    className={`
                      px-6 py-4 whitespace-nowrap text-sm
                      ${column.align === 'right' ? 'text-right' : ''}
                    `}
                  >
                    {column.render ? column.render(value) : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <ViewToggle />
      {viewMode === 'grid' ? <GridView /> : <TableView />}
    </div>
  );
}

const TIER_STYLES: Record<PrizeTier, { bg: string; color: string }> = {
  platinum: { bg: 'bg-gray-100', color: 'text-gray-900' },
  gold: { bg: 'bg-yellow-100', color: 'text-yellow-800' },
  silver: { bg: 'bg-gray-100', color: 'text-gray-700' },
  bronze: { bg: 'bg-orange-100', color: 'text-orange-800' }
};