// frontend/admin/src/features/prizes/components/PrizeTemplateList.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card';
import {
    Trophy,
    Gift,
    Package as PackageIcon,
    DollarSign,
    Plus,
    Users
} from 'lucide-react';
import { useTemplateStore } from '../store/PrizeTemplateStore';
import { PrizeTemplate, PRIZE_TIERS } from '@/types/prizes';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: typeof Trophy | typeof PackageIcon | typeof Users | typeof DollarSign;
    description?: string;
    className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    icon: Icon,
    description,
    className = ''
}) => (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                    {description && (
                        <p className="mt-1 text-sm text-gray-600">{description}</p>
                    )}
                </div>
                <div className="p-3 bg-gray-50 rounded-full">
                    <Icon className="h-6 w-6 text-gray-400" />
                </div>
            </div>
        </CardContent>
    </Card>
);

/**
 * PrizeTemplateList Component
 * 
 * Displays a list of prize templates with metrics and management capabilities.
 * Includes filtering, sorting, and creation functionality.
 */
export function PrizeTemplateList() {
    const router = useRouter();
    const {
        templates,
        isLoading,
        error,
        fetchTemplates
    } = useTemplateStore();

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Calculate template metrics
    const totalValues = templates.reduce((acc, template) => ({
        retail: acc.retail + template.values.retail,
        cash: acc.cash + template.values.cash,
        credit: acc.credit + template.values.credit
    }), { retail: 0, cash: 0, credit: 0 });

    const activeTemplates = templates.filter(t => t.pools_count > 0);
    const activePercentage = templates.length > 0
        ? ((activeTemplates.length / templates.length) * 100).toFixed(1)
        : '0.0';

    const handleCreateTemplate = () => {
        router.push('/admin/prizes/templates/create');
    };

    const handleTemplateClick = (id: number) => {
        router.push(`/admin/prizes/templates/${id}`);
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
            <ErrorState
                title="Failed to Load Templates"
                message={error}
                onRetry={fetchTemplates}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Prize Templates</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage and monitor your prize template inventory
                    </p>
                </div>
                <button
                    onClick={handleCreateTemplate}
                    className="inline-flex items-center px-4 py-2 rounded-lg
                             bg-indigo-600 text-white hover:bg-indigo-700
                             transition-colors duration-200 shadow-sm"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Template
                </button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Templates"
                    value={templates.length}
                    icon={PackageIcon}
                />
                <MetricCard
                    title="Active Templates"
                    value={activeTemplates.length}
                    icon={Trophy}
                    description={`${activePercentage}% utilization`}
                />
                <MetricCard
                    title="Total Value"
                    value={formatCurrency(totalValues.retail)}
                    icon={DollarSign}
                    description={`Cash: ${formatCurrency(totalValues.cash)} | Credit: ${formatCurrency(totalValues.credit)}`}
                />
                <MetricCard
                    title="Total Claims"
                    value={templates.reduce((acc, t) => acc + t.instances_claimed, 0)}
                    icon={Users}
                />
            </div>

            {/* Templates Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Template Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Tier</TableCell>
                                <TableCell className="text-right">Retail Value</TableCell>
                                <TableCell className="text-right">Cash Value</TableCell>
                                <TableCell className="text-right">Credit Value</TableCell>
                                <TableCell className="text-center">Usage</TableCell>
                                <TableCell>Created</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow
                                    key={template.id}
                                    className="cursor-pointer hover:bg-gray-50/50"
                                    onClick={() => handleTemplateClick(template.id)}
                                >
                                    <TableCell className="font-medium">{template.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            {template.type === 'instant_win' ? (
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
                                    </TableCell>
                                    <TableCell>
                                        <span className={`
                                            inline-flex items-center px-2 py-1 rounded-full 
                                            text-xs font-medium ${PRIZE_TIERS[template.tier].bgGradient} 
                                            ${PRIZE_TIERS[template.tier].textColor}
                                        `}>
                                            {PRIZE_TIERS[template.tier].label}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(template.values.retail)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(template.values.cash)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(template.values.credit)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {template.pools_count}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(template.created_at)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}