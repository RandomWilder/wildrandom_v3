import React from 'react';
import { Ticket, Calendar, Clock, Trophy, AlertCircle } from 'lucide-react';

interface NoInstantWinFaceProps {
  ticketNumber: string;
  purchaseDate: string;
  revealDate: string;
  drawDate?: string;
  isDrawEnded?: boolean;
  raffleTitle: string;
  isRevealed?: boolean; // Make optional with '?' for backward compatibility
}

const NoInstantWinFace: React.FC<NoInstantWinFaceProps> = ({
  ticketNumber,
  purchaseDate,
  revealDate,
  drawDate,
  isDrawEnded = false,
  raffleTitle,
  isRevealed = false // Default to false if not provided
}) => {
  // Removed confetti-related state and effects since it's now handled at the TicketCard level
  
  return (
    <div className="ticket-base bg-gradient-to-br from-gray-50 to-white">
      {/* Ticket Stub */}
      <div className="ticket-stub bg-indigo-600">
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
          
          {/* Status Badge - Moved No Instant Win message here */}
          <div className="flex flex-col items-end">
            <div className="text-gray-700 font-medium text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-1 text-indigo-600" /> 
              No Instant Win
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              <span>Revealed: {new Date(revealDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Divider */}
        <div className="border-t border-dotted border-indigo-200"></div>
        
        {/* Result Message */}
        <p className="text-sm text-gray-600 mt-1 mb-1">
          Main draw still active:
        </p>
          
        {/* Prize Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-2 rounded-lg border border-indigo-100 flex items-center justify-center">
          <Trophy className="w-4 h-4 mr-2 text-indigo-600" />
          <span className="text-indigo-800 font-medium">{raffleTitle}</span>
        </div>
        
        {/* Draw Status - Centered */}
        <div className="mt-4 flex justify-center">
          <div className={`text-sm ${isDrawEnded ? 'text-gray-600' : 'text-indigo-600'}`}>
            {isDrawEnded ? (
              <div className="flex items-center">
                <span className="font-medium mr-1">Draw Ended:</span>
                <span className="text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  No Win
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="font-medium mr-1">Draw in:</span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {drawDate || 'DD:HH:MM'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoInstantWinFace;