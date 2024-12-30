import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { usePrizeStore } from '@/stores/prizeStore';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PrizeValueInput } from '@/components/prizes/PrizeValueInput';
import type { CreateTemplatePayload, PrizeType, PrizeTier } from '@/types/prizes/models';
import { LoadingSpinner } from '@/components/ui/loading';
import { prizeApi } from '@/api/prizeApi';

// Prize type configurations
const PRIZE_TYPES: { value: PrizeType; label: string }[] = [
  { value: 'instant_win', label: 'Instant Win' },
  { value: 'draw_win', label: 'Draw Win' }
];

// Prize tier configurations with metadata
const PRIZE_TIERS: { value: PrizeTier; label: string; description: string }[] = [
  { 
    value: 'platinum', 
    label: 'Platinum',
    description: 'Highest value prizes with premium rewards'
  },
  { 
    value: 'gold', 
    label: 'Gold',
    description: 'High-value prizes with excellent rewards'
  },
  { 
    value: 'silver', 
    label: 'Silver',
    description: 'Mid-tier prizes with good value'
  },
  { 
    value: 'bronze', 
    label: 'Bronze',
    description: 'Entry-level prizes with fair rewards'
  }
];

// Initial form state
const initialFormState: CreateTemplatePayload = {
  name: '',
  type: 'instant_win',
  tier: 'gold',
  retail_value: 0,
  cash_value: 0,
  credit_value: 0
};

export default function CreateTemplatePage() {
  const router = useRouter();
  const { createTemplate, isLoading, error } = usePrizeStore();
  const [formData, setFormData] = useState<CreateTemplatePayload>(initialFormState);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    // Validate form
    const errors = prizeApi.validateTemplate(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      await createTemplate(formData);
      router.push('/admin/prizes/templates');
    } catch (err) {
      const error = err as Error;
      setValidationErrors([error.message]);
    }
  };

  const handleChange = (field: keyof CreateTemplatePayload, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation errors when user makes changes
    setValidationErrors([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Templates
        </button>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Create Prize Template
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure a new prize template for use in prize pools
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Please correct the following errors:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 
                         shadow-sm py-2 px-3 focus:outline-none focus:ring-2 
                         focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter template name"
              />
            </div>

            {/* Type & Tier */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prize Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value as PrizeType)}
                  className="block w-full rounded-lg border border-gray-300 
                           shadow-sm py-2 px-3 focus:outline-none focus:ring-2 
                           focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {PRIZE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prize Tier
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) => handleChange('tier', e.target.value as PrizeTier)}
                  className="block w-full rounded-lg border border-gray-300 
                           shadow-sm py-2 px-3 focus:outline-none focus:ring-2 
                           focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {PRIZE_TIERS.map(tier => (
                    <option key={tier.value} value={tier.value}>
                      {tier.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {PRIZE_TIERS.find(t => t.value === formData.tier)?.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prize Values */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Prize Values
          </h2>
          <div className="space-y-4">
            <PrizeValueInput
              label="Retail Value"
              value={formData.retail_value}
              onChange={(value) => handleChange('retail_value', value)}
              error={validationErrors.find(e => e.includes('retail'))}
            />
            <PrizeValueInput
              label="Cash Value"
              value={formData.cash_value}
              onChange={(value) => handleChange('cash_value', value)}
              error={validationErrors.find(e => e.includes('cash'))}
            />
            <PrizeValueInput
              label="Credit Value"
              value={formData.credit_value}
              onChange={(value) => handleChange('credit_value', value)}
              error={validationErrors.find(e => e.includes('credit'))}
            />
          </div>
        </div>

        {/* Business Rules */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900">Important Notes</h3>
          <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Templates cannot be modified once used in prize pools</li>
            <li>All values must be positive numbers</li>
            <li>Cash and credit values typically should not exceed retail value</li>
            {formData.type === 'instant_win' && (
              <li>Instant win prizes require odds configuration in pools</li>
            )}
            {formData.type === 'draw_win' && (
              <li>Draw win prizes require distribution type configuration in pools</li>
            )}
          </ul>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 
                     hover:text-gray-900 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent 
                     rounded-lg shadow-sm text-sm font-medium text-white 
                     bg-indigo-600 hover:bg-indigo-700 focus:outline-none 
                     focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Creating...
              </>
            ) : (
              'Create Template'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Specify layout and auth requirement
CreateTemplatePage.getLayout = (page: React.ReactElement) => (
  <AdminLayout>{page}</AdminLayout>
);

CreateTemplatePage.requireAuth = true;