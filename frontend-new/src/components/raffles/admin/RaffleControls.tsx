// src/components/raffles/admin/RaffleControls.tsx
import { useState } from 'react';
import { Play, Pause, XSquare, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RaffleState, RaffleStatus } from '@/types/raffles';
import { useRaffleStore } from '@/stores/raffleStore';

interface RaffleControlsProps {
  raffleId: number;
  currentState: RaffleState;
  currentStatus: RaffleStatus;
}

const STATE_TRANSITIONS: Record<RaffleState, RaffleState[]> = {
  [RaffleState.DRAFT]: [RaffleState.COMING_SOON],
  [RaffleState.COMING_SOON]: [RaffleState.OPEN],
  [RaffleState.OPEN]: [RaffleState.PAUSED, RaffleState.ENDED],
  [RaffleState.PAUSED]: [RaffleState.OPEN, RaffleState.ENDED],
  [RaffleState.ENDED]: []
};

/**
 * RaffleControls Component
 * Provides centralized state and status management for raffles with
 * direct integration to backend state transition endpoints.
 */
const RaffleControls: React.FC<RaffleControlsProps> = ({
  raffleId,
  currentState,
  currentStatus,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { updateRaffleState, updateRaffleStatus, loadRaffle } = useRaffleStore();

  // Handle state transitions with backend integration
  const handleStateTransition = async (newState: RaffleState) => {
    try {
      setIsProcessing(true);
      await updateRaffleState(raffleId, {
        state: newState,
        reason: `Admin initiated state transition to ${newState}`
      });
      await loadRaffle(raffleId); // Refresh raffle data
    } catch (error) {
      console.error('Failed to update state:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle status changes with backend integration
  const handleStatusChange = async (newStatus: RaffleStatus) => {
    try {
      setIsProcessing(true);
      await updateRaffleStatus(raffleId, {
        status: newStatus,
        reason: `Admin ${newStatus === 'active' ? 'activated' : 'deactivated'} raffle`
      });
      await loadRaffle(raffleId); // Refresh raffle data
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle raffle cancellation
  const handleCancelRaffle = async () => {
    try {
      setIsProcessing(true);
      await updateRaffleStatus(raffleId, {
        status: RaffleStatus.CANCELLED,
        reason: 'Admin cancelled raffle'
      });
      await loadRaffle(raffleId);
      setIsConfirmOpen(false);
    } catch (error) {
      console.error('Failed to cancel raffle:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get valid state transitions
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
              onClick={() => handleStatusChange(RaffleStatus.ACTIVE)}
              disabled={currentState === RaffleState.ENDED || isProcessing}
            >
              <Play className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Activate'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusChange(RaffleStatus.INACTIVE)}
              disabled={currentState === RaffleState.ENDED || isProcessing}
            >
              <Pause className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Deactivate'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isProcessing}
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
                onClick={() => handleStateTransition(state)}
                disabled={isProcessing}
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