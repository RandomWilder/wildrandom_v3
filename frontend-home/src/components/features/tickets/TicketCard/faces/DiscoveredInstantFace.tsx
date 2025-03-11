import React from 'react';
import Button from '../../../../common/Button';
import { Ticket, Calendar, Gift, Award, Check, DollarSign } from 'lucide-react';

/**
 * Interface for prize data structure returned from API
 * Matches the actual API response structure
 */
interface PrizeData {
  instance_id: string;
  name: string;
  type: string;
  values: {
    cash: number;
    credit: number;
    retail: number;
  };
}

/**
 * Props definition for the DiscoveredInstantFace component
 */
interface DiscoveredInstantFaceProps {
  ticketNumber: string;
  purchaseDate: string;
  revealDate: string;
  prizeData: PrizeData;
  onClaim: (prizeId: string) => void;
  isProcessing?: boolean;
}

/**
 * DiscoveredInstantFace Component
 * 
 * Displays the discovered instant win prize with specific information
 * from the API response.
 */
const DiscoveredInstantFace: React.FC<DiscoveredInstantFaceProps> = ({
  ticketNumber,
  purchaseDate,
  revealDate,
  prizeData,
  onClaim,
  isProcessing = false
}) => {
  // Check if prize data exists to prevent errors
  if (!prizeData) {
    console.error("Prize data is missing in DiscoveredInstantFace");
    return null;
  }
  
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
              <Gift className="w-4 h-4 mr-1 text-green-600" />
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
        
        {/* Prize Information Section */}
        <div className="prize-info mt-1">
          <div className="flex items-center justify-center mb-1">
            <Award className="w-4 h-4 mr-1 text-green-600" />
            <h2 className="text-md font-bold text-green-700">
              Prize Discovered!
            </h2>
          </div>
          
          {/* Prize Name from the API response */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-1.5 rounded-lg border border-green-200 mb-3">
            <h3 className="text-center font-medium text-green-800">
              {prizeData.name || "Prize"}
            </h3>
            
            {/* Site-Credit Value Display */}
            {prizeData.values && (
              <p className="text-center text-green-700 font-bold mt-1 flex items-center justify-center">
                <DollarSign className="w-3 h-3 mr-1" />
                <span className="mr-1">Site-Credit Value:</span>
                <span>{prizeData.values.credit.toLocaleString()}</span>
              </p>
            )}
          </div>
          
          {/* Claim Button */}
          <div className="flex justify-center mt-3">
            <Button
              variant="primary"
              onClick={() => onClaim(prizeData.instance_id)}
              isLoading={isProcessing}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 py-2 text-sm font-medium transition-colors duration-200 flex items-center"
            >
              <Check className="w-4 h-4 mr-1" />
              Claim Prize
            </Button>
          </div>
        </div>
        
        {/* Instance ID in small font at bottom left */}
        <div className="absolute bottom-2 left-8 text-[8px] text-gray-400">
          ID: {prizeData.instance_id}
        </div>
      </div>
    </div>
  );
};

export default DiscoveredInstantFace;