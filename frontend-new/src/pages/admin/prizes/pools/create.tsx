// src/pages/admin/prizes/pools/create.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import type { NextPageWithLayout } from '@/types/next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { usePoolStore } from '@/stores/poolStore';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { CreatePoolPayload, validateCreatePool } from '@/types/pools';

interface FormState {
  name: string;
  description: string;
}

const CreatePoolPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { createPool, isLoading, error } = usePoolStore();
  const [formData, setFormData] = useState<FormState>({
    name: '',
    description: ''
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateCreatePool(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
  
    try {
      const payload: CreatePoolPayload = {
        name: formData.name,
        description: formData.description || undefined // Convert empty string to undefined
      };
      await createPool(payload);
      router.push('/admin/prizes/pools');
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Failed to create pool']);
    }
  };

  const handleInputChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
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
          Back to Pools
        </button>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Create Prize Pool
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new prize pool for template allocation
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex">
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

        {/* Pool Information */}
        <Card>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Pool Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleInputChange('name')}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter pool name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange('description')}
                rows={4}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter pool description (optional)"
              />
            </div>
          </div>
        </Card>

        {/* Business Rules */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-900">Important Notes</h3>
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Pool must have template allocations before it can be locked</li>
              <li>Template allocations cannot be modified after pool is locked</li>
              <li>Total odds must equal 100% before pool can be locked</li>
              <li>At least one draw win prize is required</li>
            </ul>
          </div>
        </Card>

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
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              'Create Pool'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

CreatePoolPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

CreatePoolPage.requireAuth = true;

export default CreatePoolPage;