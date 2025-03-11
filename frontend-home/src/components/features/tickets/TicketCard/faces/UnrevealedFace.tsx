import React from 'react';
import Button from '../../../../common/Button';
import { Ticket, Calendar, Star } from 'lucide-react';

interface UnrevealedFaceProps {
  ticketNumber: string;
  purchaseDate: string;
  onReveal: () => void;
  isProcessing?: boolean;
}

const UnrevealedFace: React.FC<UnrevealedFaceProps> = ({
  ticketNumber,
  purchaseDate,
  onReveal,
  isProcessing = false
}) => {
  return (
    <div className="ticket-base">
      {/* Ticket Stub Design */}
      <div className="ticket-stub">
        <div className="ticket-stub-hole" />
        <div className="ticket-stub-hole" />
        <div className="ticket-stub-hole" />
        <div className="ticket-stub-hole" />
      </div>
      
      <div className="ticket-content">
        {/* Ticket Header */}
        <div className="ticket-header">
          <div>
            <div className="flex items-center">
              <Ticket className="w-3 h-3 mr-1 text-indigo-600" />
              <span className="text-xs ticket-number">#{ticketNumber}</span>
            </div>
            <div className="flex items-center ticket-date -mt-0.5">
              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
              <span>Purchased: {new Date(purchaseDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Status Badge - Moved to top right */}
          <div className="flex flex-col items-end">
            <div className="text-gray-700 font-medium text-sm flex items-center">
              <Star className="w-4 h-4 mr-1 text-indigo-600 animate-[star-pulse_2s_ease-in-out_infinite]" />
              <span>Good Luck!</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Divider */}
        <div className="border-t border-dotted border-indigo-200"></div>
        
        {/* Raffle Text - Modified message */}
        <div className="reveal-cta text-center mt-4">
          <span className="text-indigo-800 font-medium">Reveal your Instant Win</span>
        </div>
        
        {/* Action Button */}
        <div className="action-button mt-4 flex justify-end">
          <Button
            variant="primary"
            onClick={onReveal}
            isLoading={isProcessing}
            disabled={isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-1.5 text-sm"
          >
            Reveal &gt;
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnrevealedFace;