import React from 'react';
import { Plus, Download, Upload, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

interface UserListHeaderProps {
  onCreateUser: () => void;
  onExport?: () => void;
  onImport?: () => void;
  className?: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, loading }) => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
    <p className="text-sm font-medium text-gray-600">{label}</p>
    <p className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-semibold text-gray-900">
        {loading ? '-' : value}
      </span>
      {subValue && (
        <span className="text-sm text-gray-500">
          {loading ? '' : subValue}
        </span>
      )}
    </p>
  </div>
);

export const UserListHeader: React.FC<UserListHeaderProps> = ({
  onCreateUser,
  onExport,
  onImport,
  className
}) => {
  const { 
    totalUsers,
    filters,
    isLoading,
    searchUsers,
    clearFilters
  } = useUserStore();

  // Handle search input with debouncing
  const [searchQuery, setSearchQuery] = React.useState('');
  const searchTimeout = React.useRef<NodeJS.Timeout>();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query);
      } else {
        clearFilters();
      }
    }, 300);
  };

  React.useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Calculate filtered vs total counts
  const hasActiveFilters = Object.keys(filters).length > 0;
  const filteredCount = hasActiveFilters ? totalUsers : undefined;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Title and Actions */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and monitor user accounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {onImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onImport}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}

          <Button
            size="sm"
            onClick={onCreateUser}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            New User
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Users"
          value={totalUsers}
          subValue={filteredCount ? `${filteredCount} filtered` : undefined}
          loading={isLoading}
        />
        {/* Additional metric cards can be added here */}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2
                       text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListHeader;