// src/components/features/tickets/EmptyTicketsView.tsx
import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { Trophy } from '../../common/icons';

export const EmptyTicketsView: FC = () => {
  const navigate = useNavigate();

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center text-center space-y-6">
        <Trophy className="w-12 h-12 text-gray-400" />
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            No Tickets Found
          </h3>
          <p className="text-gray-600">
            Start your winning journey by purchasing tickets from our active raffles
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2"
        >
          Buy Your First Tickets
        </Button>
      </div>
    </Card>
  );
};

export default EmptyTicketsView;