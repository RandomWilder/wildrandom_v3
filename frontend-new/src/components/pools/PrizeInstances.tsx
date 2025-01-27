// src/components/pools/PrizeInstances.tsx
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';

interface PrizeInstance {
  instance_id: string;
  template_id: number;
  type: 'instant_win' | 'draw_win';
  status: string;
  values: {
    retail: number;
    cash: number;
    credit: number;
  };
  created_at: string;
  discovery_info: any | null;
  claim_info: any | null;
}

interface PrizeInstancesProps {
  poolId: number;
  instances: PrizeInstance[];
  isLoading: boolean;
  summary: {
    available: number;
    claimed: number;
    discovered: number;
    expired: number;
    voided: number;
  };
}

export function PrizeInstances({ poolId, instances, isLoading, summary }: PrizeInstancesProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(summary).map(([key, value]) => (
          <Card key={key} className="p-4">
            <h3 className="text-sm font-medium text-gray-500 capitalize">{key}</h3>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>

      {/* Instances Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Values</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {instances.map((instance) => (
                <tr key={instance.instance_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {instance.instance_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {instance.type.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${instance.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                      instance.status === 'CLAIMED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}`}>
                      {instance.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div>
                      <div className="font-medium">{formatCurrency(instance.values.retail)}</div>
                      <div className="text-gray-500 text-xs">
                        Cash: {formatCurrency(instance.values.cash)} | 
                        Credit: {formatCurrency(instance.values.credit)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {formatDate(instance.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}