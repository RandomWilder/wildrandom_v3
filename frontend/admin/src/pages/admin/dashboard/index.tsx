import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome to the WildRandom management interface.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Active Raffles', value: '12' },
            { label: 'Total Users', value: '1,234' },
            { label: 'Total Revenue', value: '$45,678' },
            { label: 'Prize Pool Value', value: '$12,345' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}