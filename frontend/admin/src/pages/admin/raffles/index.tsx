import { RafflesLayout } from '@/features/raffles/components/RafflesLayout';
import { useState } from 'react';

export default function RafflesPage() {
  const [activeFilter, setActiveFilter] = useState('active');

  return (
    <RafflesLayout activeTab="raffles">
      <div className="space-y-4">
        {/* Raffle Filters */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['active', 'upcoming', 'ended'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeFilter === filter
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Raffle List - To be implemented */}
        <div className="bg-white shadow-sm rounded-lg">
          {/* Raffle items will go here */}
        </div>
      </div>
    </RafflesLayout>
  );
}