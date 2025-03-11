import { FC, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Gift, CreditCard } from 'lucide-react';
import { TicketStatus } from '../../../../features/tickets/types';

interface TicketActionButtonProps {
  label: string;
  icon: typeof Ticket | typeof Gift | typeof CreditCard;
  onClick: () => void;
  isActive: boolean;
  isMobile: boolean;
}

const TicketActionButton: FC<TicketActionButtonProps> = memo(({
  label,
  icon: Icon,
  onClick,
  isActive,
  isMobile
}) => {
  const getActionStyles = useCallback(() => {
    const baseStyles = `
      flex items-center justify-center
      font-medium transition-all duration-150
      transform-gpu backdrop-blur-sm
    `;

    return isMobile ? `
      ${baseStyles}
      w-full py-3 rounded-xl
      text-sm touch-manipulation
      ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100/80 text-gray-700'}
    ` : `
      ${baseStyles}
      px-4 py-2 rounded-lg
      text-base hover:shadow-md
      ${isActive ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}
    `;
  }, [isActive, isMobile]);

  return (
    <motion.button
      whileTap={isMobile ? { scale: 0.98 } : undefined}
      whileHover={!isMobile ? { scale: 1.02 } : undefined}
      className={getActionStyles()}
      onClick={onClick}
    >
      <Icon className="w-5 h-5 mr-2" />
      <span>{label}</span>
    </motion.button>
  );
});

TicketActionButton.displayName = 'TicketActionButton';

interface TicketActionsProps {
  status: TicketStatus;
  isRevealed: boolean;
  onReveal?: () => Promise<void>;
  onDiscover?: () => Promise<void>;
  onClaim?: () => Promise<void>;
  className?: string;
  isMobile?: boolean;
}

const TicketActions: FC<TicketActionsProps> = ({
  status,
  isRevealed,
  onReveal,
  onDiscover,
  onClaim,
  className = '',
  isMobile = false
}) => {
  const renderActions = useCallback(() => {
    // Handle unrevealed tickets that can be revealed
    if (!isRevealed && status === TicketStatus.SOLD) {
      return (
        <TicketActionButton
          label="Reveal Ticket"
          icon={Ticket}
          onClick={onReveal!}
          isActive={true}
          isMobile={isMobile}
        />
      );
    }

    // Handle revealed tickets ready for prize discovery
    if (isRevealed && status === TicketStatus.REVEALED) {
      return (
        <TicketActionButton
          label="Discover Prize"
          icon={Gift}
          onClick={onDiscover!}
          isActive={true}
          isMobile={isMobile}
        />
      );
    }

    // Reserved tickets cannot be interacted with yet
    if (status === TicketStatus.RESERVED) {
      return null;
    }

    return null;
  }, [status, isRevealed, onReveal, onDiscover, isMobile]);

  return (
    <div 
      className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-3'} ${className}`}
      role="group"
      aria-label="Ticket actions"
    >
      {renderActions()}
    </div>
  );
};

export default memo(TicketActions);