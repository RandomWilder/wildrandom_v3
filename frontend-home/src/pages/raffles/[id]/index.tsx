// src/pages/raffles/[id]/index.tsx

import { FC, useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { raffleAPI } from '../../../api/endpoints';
import { Loader, AlertTriangle } from '../../../components/common/icons';
import RaffleHeader from '../../../components/features/raffles/RaffleHeader';
import RafflePrizePool from '../../../components/features/raffles/RafflePrizePool';
import RaffleProgress from '../../../components/features/raffles/RaffleProgress';
import RaffleActions from '../../../components/features/raffles/RaffleActions';
import RaffleStats from '../../../components/features/raffles/RaffleStats';
import type { Raffle } from '../../../api/types';
import { isApiError } from '../../../api/types';

/**
 * RafflePage Component
 * Displays detailed information about a specific raffle with responsive layout optimization
 * 
 * @component
 * @implements {FC}
 */
const RafflePage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    controllerRef.current = new AbortController();

    const fetchRaffle = async () => {
      if (!id || isNaN(parseInt(id, 10))) {
        setError('Invalid raffle ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await raffleAPI.getRaffle(parseInt(id, 10));

        if (mounted) {
          if (isApiError(response)) {
            throw new Error(response.error);
          }

          setRaffle(response);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching raffle:', err);
          setError(err instanceof Error ? err.message : 'Failed to load raffle');
          setRaffle(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchRaffle();

    return () => {
      mounted = false;
      controllerRef.current?.abort();
    };
  }, [id]);

  // Invalid ID State
  if (!id || isNaN(parseInt(id, 10))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Invalid Raffle ID
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          The provided raffle ID is invalid.
        </p>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Error State
  if (error || !raffle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Unable to Load Raffle
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          {error || 'The requested raffle could not be found.'}
        </p>
      </div>
    );
  }

  // Success State
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8 pb-[140px] lg:pb-0"> {/* Mobile spacing for fixed CTA */}
        <RaffleHeader raffle={raffle} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <RafflePrizePool raffle={raffle} />
            <RaffleProgress raffle={raffle} />
            <RaffleStats raffle={raffle} />
          </div>
          
          {/* Desktop Actions Panel */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <RaffleActions 
                raffle={raffle} 
                className="hidden lg:block"
              />
            </div>
          </div>

          {/* Mobile Actions Panel */}
          <div className="lg:hidden">
            <RaffleActions 
              raffle={raffle} 
              className="block lg:hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RafflePage;