import React from 'react';
import { RaffleState } from '@/types/raffles';

interface Props {
  state: RaffleState;
}

const stateConfig = {
  [RaffleState.DRAFT]: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700'
  },
  [RaffleState.COMING_SOON]: {
    label: 'Coming Soon',
    className: 'bg-blue-100 text-blue-700'
  },
  [RaffleState.OPEN]: {
    label: 'Open',
    className: 'bg-green-100 text-green-700'
  },
  [RaffleState.PAUSED]: {
    label: 'Paused',
    className: 'bg-yellow-100 text-yellow-700'
  },
  [RaffleState.ENDED]: {
    label: 'Ended',
    className: 'bg-red-100 text-red-700'
  }
};

export const RaffleStateChip: React.FC<Props> = ({ state }) => {
  const config = stateConfig[state];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default RaffleStateChip;