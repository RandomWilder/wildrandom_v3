import React from 'react';
import { RaffleStatus } from '@/types/raffles';
import { Badge } from '@/components/ui/badge';

interface Props {
  status: RaffleStatus;
}

const statusConfig = {
  [RaffleStatus.ACTIVE]: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 hover:bg-green-100'
  },
  [RaffleStatus.INACTIVE]: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  },
  [RaffleStatus.CANCELLED]: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 hover:bg-red-100'
  }
};

export const RaffleStatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export default RaffleStatusBadge;