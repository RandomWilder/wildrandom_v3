import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../../../../common/Button';
import { Ticket, Calendar, Gift, SparkleIcon } from 'lucide-react';
interface InstantWinFaceProps {
  ticketNumber: string;
  purchaseDate: string;
  revealDate: string;
  onDiscover: () => void;
  isProcessing?: boolean;
  isRevealed?: boolean; // Add isRevealed prop for consistency with NoInstantWinFace
}

const InstantWinFace: React.FC<InstantWinFaceProps> = ({
  ticketNumber,
  purchaseDate,
  revealDate,
  onDiscover,
  isProcessing = false,
  isRevealed = false // Default to false if not provided
}) => {
  return (
    <div className="ticket-base bg-gradient-to-br from-green-50 to-white">
      {/* Ticket Stub */}
      <div className="ticket-stub bg-green-600">
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
              <Ticket className="w-3 h-3 mr-1 text-green-600" />
              <span className="text-xs ticket-number">#{ticketNumber}</span>
            </div>
            <div className="flex items-center ticket-date -mt-0.5">
              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
              <span>Purchased: {new Date(purchaseDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-green-700 font-medium text-sm flex items-center">
              <Gift className="w-4 h-4 mr-1 text-green-600 animate-[star-pulse_1.5s_ease-in-out_infinite]" />
              Winner!
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              <span>Revealed: {new Date(revealDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Divider */}
        <div className="border-t border-dotted border-green-200"></div>
        
        <div className="win-banner flex flex-col items-center mt-1">
          <h2 className="text-2xl font-bold text-green-700 mb-0.5">
            Congratulations!
          </h2>
          <p className="text-green-600 text-center text-sm">
            You've revealed an Instant Win ticket!
          </p>
        </div>
        
        <div className="flex justify-center mt-4">
          <Button
            variant="primary"
            onClick={onDiscover}
            isLoading={isProcessing}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 py-2 text-sm font-medium transition-colors duration-200"
          >
            Discover Prize
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstantWinFace;