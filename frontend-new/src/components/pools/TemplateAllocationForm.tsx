// src/components/pools/TemplateAllocationForm.tsx
import { useState } from 'react';
import { Trophy, AlertCircle } from 'lucide-react';
import type { 
  PrizeTemplate, 
  DrawWinDistributionType 
} from '@/types/prizes/common';
import type { TemplateAllocation } from '@/types/pools';
import { usePoolStore } from '@/stores/poolStore';
import { formatCurrency } from '@/utils/currency';

interface TemplateAllocationFormProps {
  poolId: number;
  templates: PrizeTemplate[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormState {
  template_id: number;
  quantity: number;
  collective_odds?: number;
  distribution_type?: DrawWinDistributionType;
}

export function TemplateAllocationForm({ 
  poolId, 
  templates,
  onSuccess,
  onCancel 
}: TemplateAllocationFormProps) {
  const { allocateTemplate, isLoading, error } = usePoolStore();

  const [formData, setFormData] = useState<FormState>({
    template_id: 0,
    quantity: 1
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const selectedTemplate = templates.find(t => t.id === formData.template_id);

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.template_id) {
      errors.push('Please select a template');
    }
    
    if (formData.quantity < 1) {
      errors.push('Quantity must be at least 1');
    }

    if (selectedTemplate?.type === 'instant_win') {
      if (!formData.collective_odds) {
        errors.push('Collective odds are required for instant win prizes');
      } else if (formData.collective_odds <= 0 || formData.collective_odds > 100) {
        errors.push('Collective odds must be between 0 and 100');
      }
    }

    if (selectedTemplate?.type === 'draw_win' && !formData.distribution_type) {
      errors.push('Distribution type is required for draw win prizes');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Transform form data to match backend expectations
      const allocation: TemplateAllocation = {
        template_id: formData.template_id,
        quantity: formData.quantity,
        ...(formData.collective_odds && { collective_odds: formData.collective_odds }),
        ...(formData.distribution_type && { distribution_type: formData.distribution_type })
      };

      await allocateTemplate(poolId, allocation);
      onSuccess();
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Failed to allocate template']);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Validation Errors */}
      {(validationErrors.length > 0 || error) && (
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
                  {error && <li>{error}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Select Template
        </label>
        <select
          value={formData.template_id}
          onChange={(e) => {
            setFormData(prev => ({
              ...prev,
              template_id: Number(e.target.value),
              collective_odds: undefined,
              distribution_type: undefined
            }));
          }}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                   focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 
                   rounded-lg"
        >
          <option value={0}>Select a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({template.type === 'instant_win' ? 'Instant Win' : 'Draw Win'})
            </option>
          ))}
        </select>
      </div>

      {/* Selected Template Preview */}
      {selectedTemplate && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{selectedTemplate.name}</h3>
              <div className="mt-1 text-sm text-gray-500">
                <div>Retail Value: {formatCurrency(selectedTemplate.values.retail)}</div>
                <div>Cash Value: {formatCurrency(selectedTemplate.values.cash)}</div>
                <div>Credit Value: {formatCurrency(selectedTemplate.values.credit)}</div>
              </div>
            </div>
            <Trophy className={`
              h-8 w-8
              ${selectedTemplate.type === 'instant_win' ? 'text-amber-500' : 'text-purple-500'}
            `} />
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Quantity
        </label>
        <input
          type="number"
          min="1"
          value={formData.quantity}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            quantity: parseInt(e.target.value) || 1
          }))}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2
                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Type-specific Fields */}
      {selectedTemplate?.type === 'instant_win' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Collective Odds (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.collective_odds || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              collective_odds: parseFloat(e.target.value) || 0
            }))}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {formData.collective_odds && formData.quantity > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Individual odds will be {(formData.collective_odds / formData.quantity).toFixed(2)}% per instance
            </p>
          )}
        </div>
      )}

      {selectedTemplate?.type === 'draw_win' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Distribution Type
          </label>
          <select
            value={formData.distribution_type || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              distribution_type: e.target.value as DrawWinDistributionType
            }))}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select distribution type...</option>
            <option value="SPLIT">Split (divide value among winners)</option>
            <option value="FULL">Full (each winner gets full value)</option>
          </select>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
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
          {isLoading ? 'Allocating...' : 'Add Allocation'}
        </button>
      </div>
    </form>
  );
}