// src/pages/my-tickets/index.tsx

import { FC } from 'react';
import { motion } from 'framer-motion';
import Card from '../../components/common/Card';
import { Ticket } from 'lucide-react';

/**
 * Simple My Tickets Page
 * Initial implementation with basic structure and mockup of ticket groups
 */
const MyTicketsPage: FC = () => {
  // Mock data for demonstration
  const mockTicketGroups = [
    {
      id: 1,
      title: "Summer Festival Raffle",
      totalTickets: 5,
      unrevealedTickets: 3,
      endDate: "2025-03-15"
    },
    {
      id: 2,
      title: "Tech Gadgets Giveaway",
      totalTickets: 2,
      unrevealedTickets: 0,
      endDate: "2025-03-10"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          My Tickets
        </h1>
        <p className="mt-1 text-gray-600">
          Manage your raffle tickets and check for prizes
        </p>
      </div>

      {/* Ticket Groups */}
      <div className="space-y-4">
        {mockTicketGroups.map(group => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            <Card variant="default" className="p-4 cursor-pointer hover:shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {group.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {group.totalTickets} tickets • Ends {new Date(group.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                {group.unrevealedTickets > 0 && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full flex items-center">
                    <Ticket className="w-4 h-4 mr-1" />
                    {group.unrevealedTickets} unrevealed
                  </span>
                )}
              </div>
              
              {/* Progress indicator */}
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ 
                      width: `${((group.totalTickets - group.unrevealedTickets) / group.totalTickets) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>
                    {Math.round(((group.totalTickets - group.unrevealedTickets) / group.totalTickets) * 100)}% revealed
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State (Hidden for now, but included for later use) */}
      <div className="hidden">
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Tickets Found
            </h3>
            <p className="text-gray-500 mb-6">
              Start your winning journey by exploring our active raffles.
            </p>
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Explore Raffles
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MyTicketsPage;