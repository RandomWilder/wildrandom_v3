import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RaffleCard from '../../components/features/RaffleCard';
import Card from '../../components/common/Card';
import { raffleAPI } from '../../api/endpoints';
import type { RaffleListResponse } from '../../api/types';  // Removed unused Raffle type
import { AlertTriangle } from '../../components/common/icons';

const VALUE_PROPOSITIONS = [
  {
    title: "Transparent",
    description: "Every draw is verifiable and recorded on the blockchain",
    icon: "🔍",
  },
  {
    title: "Secure",
    description: "Enterprise-grade security protecting your transactions",
    icon: "🛡️",
  },
  {
    title: "Fair",
    description: "Provably fair random number generation for all draws",
    icon: "⚖️",
  },
] as const;

const HomePage: FC = () => {
  const navigate = useNavigate();
  const [raffleData, setRaffleData] = useState<RaffleListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchRaffles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Using axios instance directly for better error handling
        const response = await raffleAPI.listRaffles();
        console.log('API Response:', response);

        // Only update state if component is still mounted
        if (mounted) {
          if ('error' in response) {
            throw new Error(response.error);
          }
          setRaffleData(response);
        }
      } catch (err) {
        console.error('Error fetching raffles:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load raffles');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRaffles();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array since we only want to fetch once

  const handleViewDetails = (raffleId: number) => {
    navigate(`/raffles/${raffleId}`);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
          Your Winning Moment Awaits
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Experience the thrill of transparent, fair, and exciting raffles with life-changing prizes
        </p>
        <button 
          onClick={() => navigate('/raffles')}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Explore Raffles
        </button>
      </section>

      {/* Featured Raffles Grid */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Raffles</h2>
            <p className="text-gray-600 mt-1">Premium prizes with the best odds</p>
          </div>
          <button 
            onClick={() => navigate('/raffles')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View All →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(3)].map((_, index) => (
              <div 
                key={`skeleton-${index}`}
                className="h-96 bg-gray-100 rounded-xl animate-pulse"
              />
            ))
          ) : error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
              <p className="text-gray-900 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : raffleData?.raffles.length ? (
            raffleData.raffles.map((raffle) => (
              <RaffleCard
                key={raffle.id}
                raffle={raffle}
                onViewDetails={handleViewDetails}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No active raffles available at the moment.</p>
              <p className="text-sm text-gray-500 mt-2">Check back soon for new opportunities!</p>
            </div>
          )}
        </div>
      </section>

      {/* Value Propositions - This is why we need the Card component! */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {VALUE_PROPOSITIONS.map((prop) => (
          <Card key={prop.title} variant="featured" className="text-center">
            <div className="text-4xl mb-4">{prop.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {prop.title}
            </h3>
            <p className="text-gray-600">{prop.description}</p>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default HomePage;