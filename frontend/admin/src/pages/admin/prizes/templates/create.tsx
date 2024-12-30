// frontend/admin/src/pages/admin/prizes/templates/create.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { PrizeTemplateBuilder } from '@/features/prizes/components/PrizeTemplateBuilder';
import { useTemplateStore } from '@/features/prizes/store/PrizeTemplateStore.ts';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function CreatePrizeTemplatePage() {
    const router = useRouter();
    const { clearErrors, setDraftTemplate } = useTemplateStore();

    // Clean up on component unmount
    useEffect(() => {
        return () => {
            clearErrors();
            setDraftTemplate(null);
        };
    }, [clearErrors, setDraftTemplate]);

    const handleBack = () => {
        router.push('/admin/prizes/templates');
    };

    return (
        <DashboardLayout>
            <div className="px-6 py-8 space-y-6">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleBack}
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Templates
                            </button>
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Create Prize Template
                        </h1>
                        <p className="text-sm text-gray-500">
                            Configure a new prize template for use in raffle pools
                        </p>
                    </div>
                </div>

                {/* Builder Container */}
                <Card className="overflow-hidden bg-white">
                    <div className="p-6">
                        <PrizeTemplateBuilder />
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}

// Page-level metadata and configuration
CreatePrizeTemplatePage.displayName = 'CreatePrizeTemplatePage';
CreatePrizeTemplatePage.auth = true; // Require authentication

// Route validation - ensure we're in the admin context
CreatePrizeTemplatePage.getLayout = (page: React.ReactElement) => {
    return (
        <DashboardLayout>
            {page}
        </DashboardLayout>
    );
};