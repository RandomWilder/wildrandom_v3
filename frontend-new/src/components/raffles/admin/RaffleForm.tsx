// src/components/raffles/admin/RaffleForm.tsx
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle } from 'lucide-react';
import { useRaffleStore } from '@/stores/raffleStore';
import { usePrizeStore } from '@/stores/prizeStore';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import type { 
  Raffle, 
  RaffleCreatePayload, 
  RaffleUpdatePayload 
} from '@/types/raffles';
import { formatDate } from '@/utils/date';

interface RaffleFormProps {
  initialData?: Raffle;
  onSuccess?: () => void;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  prize_pool_id?: string;
  total_tickets?: string;
  ticket_price?: string;
  max_tickets_per_user?: string;
  start_time?: string;
  end_time?: string;
  general?: string;
}

export const RaffleForm: React.FC<RaffleFormProps> = ({
  initialData,
  onSuccess
}) => {
  const router = useRouter();
  const { createRaffle, updateRaffle, isLoading, error } = useRaffleStore();
  const { prizePools, loadPrizePools } = usePrizeStore();

  const [formData, setFormData] = useState<RaffleCreatePayload>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    prize_pool_id: initialData?.prize_pool_id || 0,
    total_tickets: initialData?.total_tickets || 100,
    ticket_price: initialData?.ticket_price || 1,
    max_tickets_per_user: initialData?.max_tickets_per_user || 10,
    start_time: initialData?.start_time || new Date(Date.now() + 24*60*60*1000).toISOString(),
    end_time: initialData?.end_time || new Date(Date.now() + 7*24*60*60*1000).toISOString()
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Load prize pools on mount
  React.useEffect(() => {
    loadPrizePools();
  }, [loadPrizePools]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 3 || formData.title.length > 100) {
      errors.title = 'Title must be between 3 and 100 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must not exceed 1000 characters';
    }

    // Prize pool validation
    if (!formData.prize_pool_id) {
      errors.prize_pool_id = 'Prize pool is required';
    }

    // Ticket validation
    if (formData.total_tickets < 1) {
      errors.total_tickets = 'Total tickets must be at least 1';
    }

    if (formData.ticket_price < 0.01) {
      errors.ticket_price = 'Ticket price must be at least 0.01';
    }

    if (formData.max_tickets_per_user < 1) {
      errors.max_tickets_per_user = 'Maximum tickets per user must be at least 1';
    }

    // Date validation
    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);
    const now = new Date();

    if (startDate <= now) {
      errors.start_time = 'Start time must be in the future';
    }

    if (endDate <= startDate) {
      errors.end_time = 'End time must be after start time';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (initialData) {
        await updateRaffle(initialData.id, formData as RaffleUpdatePayload);
      } else {
        await createRaffle(formData);
      }

      onSuccess?.();
      router.push('/admin/raffles');
    } catch (error) {
      setValidationErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : 'Failed to save raffle'
      }));
    }
  };

  const handleInputChange = (field: keyof RaffleCreatePayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    let value: string | number = e.target.value;
    
    // Handle different field types
    switch (field) {
      case 'prize_pool_id':
        value = parseInt(e.target.value) || 0;
        break;
      case 'total_tickets':
      case 'max_tickets_per_user':
        value = parseInt(e.target.value) || 0;
        break;
      case 'ticket_price':
        value = parseFloat(e.target.value) || 0;
        break;
      case 'start_time':
      case 'end_time':
        // Convert local datetime to ISO string
        value = new Date(e.target.value).toISOString();
        break;
      default:
        value = e.target.value;
    }
      
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {(validationErrors.general || error) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center p-4">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-600">{validationErrors.general || error}</p>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Basic Information</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={handleInputChange('title')}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.title ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
            />
            {validationErrors.title && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={handleInputChange('description')}
              rows={4}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.description ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prize Pool Selection */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Prize Pool</h3>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Prize Pool
              <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.prize_pool_id}
              onChange={handleInputChange('prize_pool_id')}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.prize_pool_id ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
            >
              <option value="">Select a prize pool...</option>
              {prizePools.map(pool => (
                <option 
                  key={pool.id} 
                  value={pool.id}
                  disabled={pool.status !== 'locked'}
                >
                  {pool.name} {pool.status !== 'locked' ? '(Not Locked)' : ''}
                </option>
              ))}
            </select>
            {validationErrors.prize_pool_id && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.prize_pool_id}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Configuration */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Ticket Configuration</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Total Tickets */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Tickets
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_tickets}
                onChange={handleInputChange('total_tickets')}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.total_tickets ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
              />
              {validationErrors.total_tickets && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.total_tickets}</p>
              )}
            </div>

            {/* Ticket Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ticket Price
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.ticket_price}
                onChange={handleInputChange('ticket_price')}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.ticket_price ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
              />
              {validationErrors.ticket_price && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.ticket_price}</p>
              )}
            </div>

            {/* Max Tickets Per User */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Tickets Per User
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_tickets_per_user}
                onChange={handleInputChange('max_tickets_per_user')}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.max_tickets_per_user ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
              />
              {validationErrors.max_tickets_per_user && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.max_tickets_per_user}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timing Configuration */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Timing Configuration</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Time
                <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.start_time.slice(0, 16)}
                onChange={handleInputChange('start_time')}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.start_time ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
              />
              {validationErrors.start_time && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.start_time}</p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Time
                <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.end_time.slice(0, 16)}
                onChange={handleInputChange('end_time')}
                className={`mt-1 block w-full rounded-md border ${
                  validationErrors.end_time ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
              />
              {validationErrors.end_time && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.end_time}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="mr-2" />
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            initialData ? 'Update Raffle' : 'Create Raffle'
          )}
        </Button>
      </div>
    </form>
  );
};

export default RaffleForm;