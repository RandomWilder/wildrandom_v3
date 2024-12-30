import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivityStore } from '@/stores/userActivityStore';
import type { ActivityFilter, ActivityType, ActivityStatus } from '@/types/users';
import { ACTIVITY_TYPE_META, ACTIVITY_STATUS_META } from '@/types/users/activities';

interface ActivityFiltersProps {
  onClose: () => void;
}

/**
 * Activity Filters Component
 * 
 * Provides comprehensive filtering capabilities for activity monitoring.
 * Integrates with activity store for real-time filter updates.
 * 
 * Features:
 * - Type-safe filter management
 * - Date range validation
 * - Input sanitization
 * - Error handling
 * - Filter persistence
 */
export const ActivityFilters: React.FC<ActivityFiltersProps> = ({ onClose }) => {
  const { filters, setFilters, clearFilters } = useActivityStore();
  const [localFilters, setLocalFilters] = useState<ActivityFilter>(filters);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate date ranges when they change
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    if (localFilters.start_date && localFilters.end_date) {
      const start = new Date(localFilters.start_date);
      const end = new Date(localFilters.end_date);
      
      if (start > end) {
        newErrors.date = 'Start date must be before end date';
      }
    }

    setErrors(newErrors);
  }, [localFilters.start_date, localFilters.end_date]);

  // Handle filter application
  const handleApplyFilters = () => {
    if (Object.keys(errors).length > 0) {
      return;
    }

    // Remove any undefined or empty string values
    const cleanedFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        acc[key as keyof ActivityFilter] = value;
      }
      return acc;
    }, {} as ActivityFilter);

    setFilters(cleanedFilters);
    onClose();
  };

  // Handle filter reset
  const handleResetFilters = () => {
    clearFilters();
    setLocalFilters({});
    setErrors({});
  };

  // Update local filters with type checking and validation
  const updateFilter = <K extends keyof ActivityFilter>(field: K, value: ActivityFilter[K] | string) => {
    setLocalFilters(prev => {
      // Handle user ID conversion and validation
      if (field === 'user_id') {
        const numericValue = value === '' ? undefined : parseInt(value as string, 10);
        if (numericValue !== undefined && isNaN(numericValue)) {
          setErrors(prev => ({ ...prev, user_id: 'Please enter a valid user ID' }));
          return prev;
        }
        setErrors(prev => {
          const { user_id, ...rest } = prev;
          return rest;
        });
        return { ...prev, [field]: numericValue };
      }

      // Handle date validations
      if (field === 'start_date' || field === 'end_date') {
        if (value === '') {
          const newFilters = { ...prev };
          delete newFilters[field];
          return newFilters;
        }
      }

      return { ...prev, [field]: value === '' ? undefined : value };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Activity Filters</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 transition-colors"
          aria-label="Close filters"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Activity Type Filter */}
        <div>
          <label htmlFor="activity_type" className="block text-sm font-medium text-gray-700 mb-1">
            Activity Type
          </label>
          <select
            id="activity_type"
            value={localFilters.activity_type || ''}
            onChange={(e) => updateFilter('activity_type', e.target.value as ActivityType)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {Object.entries(ACTIVITY_TYPE_META).map(([type, meta]) => (
              <option key={type} value={type}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        {/* Activity Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={localFilters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value as ActivityStatus)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {Object.entries(ACTIVITY_STATUS_META).map(([status, meta]) => (
              <option key={status} value={status}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filters */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            id="start_date"
            type="date"
            value={localFilters.start_date || ''}
            onChange={(e) => updateFilter('start_date', e.target.value)}
            max={localFilters.end_date || undefined}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            id="end_date"
            type="date"
            value={localFilters.end_date || ''}
            onChange={(e) => updateFilter('end_date', e.target.value)}
            min={localFilters.start_date || undefined}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* User ID Filter */}
        <div>
          <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
            User ID
          </label>
          <input
            id="user_id"
            type="number"
            value={localFilters.user_id || ''}
            onChange={(e) => updateFilter('user_id', e.target.value)}
            min="1"
            placeholder="Enter user ID"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {errors.user_id && (
            <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errors.date && (
        <div className="flex items-start space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{errors.date}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={handleResetFilters}
        >
          Reset Filters
        </Button>
        <Button
          onClick={handleApplyFilters}
          disabled={Object.keys(errors).length > 0}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default ActivityFilters;