// frontend/admin/src/pages/admin/prizes/templates/index.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { PrizeTemplateDashboard } from '@/features/prizes/components/PrizeTemplateDashboard';
import { useTemplateStore } from '@/features/prizes/store/PrizeTemplateStore.ts';
import { LoadingSpinner } from '@/components/ui/loading';

export default function PrizeTemplatesPage() {
    const router = useRouter();
    const { isLoading, error, clearErrors } = useTemplateStore();

    // Reset error state when leaving the page
    useEffect(() => {
        return () => {
            clearErrors();
        };
    }, [clearErrors]);

    // Initial loading state
    if (isLoading && !router.isReady) {
        return (
            <DashboardLayout>
                <div className="h-screen flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="px-6 py-8">
                <PrizeTemplateDashboard />
            </div>
        </DashboardLayout>
    );
}

// Add page-level metadata
PrizeTemplatesPage.displayName = 'PrizeTemplatesPage';
PrizeTemplatesPage.auth = true; // Require authentication for this page