import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/stores/userStore';
import type { UserFilters } from '@/types/users';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: keyof UserFilters;
  label: string;
  options: Array<{ value: string | boolean; label: string }>;
}

interface UserListFiltersProps {
  className?: string;
  onApply?: () => void;
}

// Filter configurations
const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { value: true, label: 'Active' },
      { value: false, label: 'Inactive' }
    ]
  },
  {
    id: 'verified',
    label: 'Verification',
    options: [
      { value: true, label: 'Verified' },
      { value: false, label: 'Unverified' }
    ]
  },
  {
    id: 'auth_provider',
    label: 'Auth Provider',
    options: [
      { value: 'local', label: 'Local' },
      { value: 'google', label: 'Google' }
    ]
  }
];

export const UserListFilters: React.FC<UserListFiltersProps> = ({
  className,
  onApply
}) => {
  const {
    filters: activeFilters,
    setFilters,
    clearFilters
  } = useUserStore();

  // Local state for filter management
  const [showFilters, setShowFilters] = React.useState(false);
  const [localFilters, setLocalFilters] = React.useState<UserFilters>(activeFilters);

  // Reset local filters when active filters change
  React.useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  // Handle filter changes
  const handleFilterChange = (filterId: keyof UserFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
    onApply?.();
  };

  // Clear all filters
  const handleClearFilters = () => {
    clearFilters();
    setShowFilters(false);
    onApply?.();
  };

  // Count active filters
  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className={cn('relative', className)}>
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="relative"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="absolute right-0 top-full mt-2 z-10 w-72 p-4 shadow-lg">
          <div className="space-y-4">
            {/* Filter Groups */}
            {FILTER_OPTIONS.map((filterGroup) => (
              <div key={filterGroup.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {filterGroup.label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterGroup.options.map((option) => (
                    <button
                      key={`${option.value}`}
                      onClick={() => handleFilterChange(
                        filterGroup.id,
                        localFilters[filterGroup.id] === option.value ? undefined : option.value
                      )}
                      className={cn(
                        'px-3 py-1 text-sm rounded-full border transition-colors',
                        localFilters[filterGroup.id] === option.value
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Created Date
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={localFilters.created_after || ''}
                  onChange={(e) => handleFilterChange('created_after', e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                />
                <input
                  type="date"
                  value={localFilters.created_before || ''}
                  onChange={(e) => handleFilterChange('created_before', e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UserListFilters;