import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Plus, AlertCircle } from 'lucide-react';
import { usePrizeStore } from '@/stores/prizeStore';
import type { PrizeTemplate } from '@/types/prizes/models';
import type { NextPageWithLayout } from '@/types/next';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { LoadingSpinner } from '@/components/ui/loading';
import { TemplateViews } from '@/components/prizes/TemplateViews';

const TemplatesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { 
    templates, 
    isLoading, 
    error,
    fetchTemplates 
  } = usePrizeStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateTemplate = () => {
    router.push('/admin/prizes/templates/create');
  };

  const handleTemplateClick = (template: PrizeTemplate) => {
    router.push(`/admin/prizes/templates/${template.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Templates
            </h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchTemplates}
              className="mt-4 text-sm font-medium text-red-800 hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prize Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your prize template configurations
          </p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="inline-flex items-center px-4 py-2 rounded-lg
                   bg-indigo-600 text-white hover:bg-indigo-700 
                   transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Template
        </button>
      </div>

      {/* Templates View */}
      <TemplateViews 
        templates={templates}
        onTemplateClick={handleTemplateClick}
      />
    </div>
  );
};

TemplatesPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

TemplatesPage.requireAuth = true;

export default TemplatesPage;