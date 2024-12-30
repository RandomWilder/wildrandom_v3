// frontend/admin/src/features/prizes/components/PrizeTemplateDetail.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
} from '@/components/ui/card';
import {
    Trophy,
    Gift,
    DollarSign,
    Package as PackageIcon,
    Users,
    Calendar,
    ArrowLeft,
    BarChart3,
    AlertCircle
} from 'lucide-react';
import { useTemplateStore } from '../store/PrizeTemplateStore.ts';
import { PrizeTemplate, PRIZE_TIERS, PRIZE_TYPES } from '@/types/prizes';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { LoadingSpinner } from '@/components/ui/loading';

interface DetailItemProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
    className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ 
    label, 
    value, 
    icon: Icon,
    className = ''
}) => (
    <div className={`flex items-center justify-between ${className}`}>
        <span className="text-sm text-gray-500">{label}</span>
        <div className="flex items-center space-x-2">
            {Icon && <Icon className="w-4 h-4 text-gray-400" />}
            <span className="font-medium">{value}</span>
        </div>
    </div>
);

interface ValueDisplayProps {
    label: string;
    value: number;
    type: 'retail' | 'cash' | 'credit';
}

const ValueDisplay: React.FC<ValueDisplayProps> = ({ label, value, type }) => {
    const getValueColor = (type: string) => {
        switch (type) {
            case 'retail': return 'text-blue-600';
            case 'cash': return 'text-green-600';
            case 'credit': return 'text-purple-600';
            default: return 'text-gray-900';
        }
    };

    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{label}</span>
            <span className={`font-medium ${getValueColor(type)}`}>
                {formatCurrency(value)}
            </span>
        </div>
    );
};

export function PrizeTemplateDetail({ templateId }: { templateId: number }) {
    const { 
        activeTemplate,
        isLoading,
        error,
        getTemplate,
        clearErrors 
    } = useTemplateStore();
    const router = useRouter();

    useEffect(() => {
        getTemplate(templateId);
        return () => clearErrors();
    }, [templateId, getTemplate, clearErrors]);

    const handleBack = () => {
        router.push('/admin/prizes/templates');
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
            <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                            Error Loading Template
                        </h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                        <button
                            onClick={() => getTemplate(templateId)}
                            className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!activeTemplate) return null;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Templates
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {activeTemplate.name}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Template ID: {activeTemplate.id}
                        </p>
                    </div>
                    <span className={`
                        inline-flex items-center px-3 py-1 rounded-full 
                        text-sm font-medium
                        ${PRIZE_TIERS[activeTemplate.tier].bgGradient}
                        ${PRIZE_TIERS[activeTemplate.tier].textColor}
                    `}>
                        {PRIZE_TIERS[activeTemplate.tier].label}
                    </span>
                </div>
            </div>

            {/* Template Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailItem
                            label="Prize Type"
                            value={
                                <div className="flex items-center space-x-2">
                                    {activeTemplate.type === 'instant_win' ? (
                                        <>
                                            <Trophy className="w-4 h-4 text-amber-500" />
                                            <span>Instant Win</span>
                                        </>
                                    ) : (
                                        <>
                                            <Gift className="w-4 h-4 text-purple-500" />
                                            <span>Draw Win</span>
                                        </>
                                    )}
                                </div>
                            }
                        />
                        <DetailItem
                            label="Created At"
                            value={formatDate(activeTemplate.created_at)}
                            icon={Calendar}
                        />
                        <DetailItem
                            label="Last Updated"
                            value={activeTemplate.updated_at ? formatDate(activeTemplate.updated_at) : 'Never'}
                            icon={Calendar}
                        />
                    </CardContent>
                </Card>

                {/* Prize Values */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Prize Values</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ValueDisplay
                            label="Retail Value"
                            value={activeTemplate.values.retail}
                            type="retail"
                        />
                        <ValueDisplay
                            label="Cash Value"
                            value={activeTemplate.values.cash}
                            type="cash"
                        />
                        <ValueDisplay
                            label="Credit Value"
                            value={activeTemplate.values.credit}
                            type="credit"
                        />
                    </CardContent>
                </Card>

                {/* Usage Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Usage Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailItem
                            label="Active Pools"
                            value={activeTemplate.pools_count}
                            icon={PackageIcon}
                        />
                        <DetailItem
                            label="Total Instances"
                            value={activeTemplate.total_instances}
                            icon={BarChart3}
                        />
                        <DetailItem
                            label="Claims"
                            value={activeTemplate.instances_claimed}
                            icon={Users}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}