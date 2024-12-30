// Path: src/components/raffles/admin/RaffleControls.tsx

import { useState } from 'react';
import { Play, Pause, XSquare, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RaffleState, RaffleStatus } from '@/types/raffles';

interface RaffleControlsProps {
  raffleId: number;
  currentState: RaffleState;
  currentStatus: RaffleStatus;
  onStateChange: (state: RaffleState) => void;
  onStatusChange: (status: RaffleStatus) => void;
}

// Type-safe state transition mapping
const STATE_TRANSITIONS: Record<RaffleState, RaffleState[]> = {
  [RaffleState.DRAFT]: [RaffleState.COMING_SOON],
  [RaffleState.COMING_SOON]: [RaffleState.OPEN],
  [RaffleState.OPEN]: [RaffleState.PAUSED, RaffleState.ENDED],
  [RaffleState.PAUSED]: [RaffleState.OPEN, RaffleState.ENDED],
  [RaffleState.ENDED]: []
};

const RaffleControls: React.FC<RaffleControlsProps> = ({
  raffleId,
  currentState,
  currentStatus,
  onStateChange,
  onStatusChange
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Get valid transitions for current state
  const getValidTransitions = (state: RaffleState): RaffleState[] => {
    return STATE_TRANSITIONS[state] || [];
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Status Controls */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Raffle Controls</h3>
          <div className="flex space-x-2">
            <Button
              variant={currentStatus === RaffleStatus.ACTIVE ? 'default' : 'outline'}
              onClick={() => onStatusChange(RaffleStatus.ACTIVE)}
              disabled={currentState === RaffleState.ENDED}
            >
              <Play className="w-4 h-4 mr-2" />
              Activate
            </Button>
            <Button
              variant="outline"
              onClick={() => onStatusChange(RaffleStatus.INACTIVE)}
              disabled={currentState === RaffleState.ENDED}
            >
              <Pause className="w-4 h-4 mr-2" />
              Deactivate
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsConfirmOpen(true)}
            >
              <XSquare className="w-4 h-4 mr-2" />
              Cancel Raffle
            </Button>
          </div>
        </div>

        {/* State Workflow */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">State Management</h4>
          <div className="flex space-x-2">
            {getValidTransitions(currentState).map((state) => (
              <Button
                key={state}
                variant="outline"
                onClick={() => onStateChange(state)}
              >
                Move to {state.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Current State Display */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Current State: {currentState.replace('_', ' ')}
              </p>
              <p className="text-sm text-gray-500">
                Status: {currentStatus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RaffleControls;