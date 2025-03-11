import React, { useState, useCallback, useEffect, useRef } from 'react';
import CardContainer, { FlipDirection } from './CardContainer';
import CardFace from './CardFace';
import UnrevealedFace from './faces/UnrevealedFace';
import InstantWinFace from './faces/InstantWinFace';
import NoInstantWinFace from './faces/NoInstantWinFace';
import DiscoveredInstantFace from './faces/DiscoveredInstantFace';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import './styles.css';

// Re-declare the FlipDirection type to ensure consistency
type LocalFlipDirection = 'horizontal' | 'vertical' | 'top-to-bottom' | 'vertical-y' | 'none';

// Define the Prize structure based on the actual API response
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

interface TicketCardProps {
  ticket: {
    id: string;
    ticket_id: string;
    ticket_number: string;
    raffle_id: number;
    user_id: number;
    status: string;
    is_revealed: boolean;
    instant_win_eligible: boolean;
    purchase_time: string;
    reveal_time: string | null;
    reveal_sequence: number | null;
    transaction_id: number | null;
    created_at: string;
    raffle_title: string;
    discovered_prize?: PrizeData;
    claim_status?: any;
  };
  onReveal?: (ticketId: string) => Promise<void>;
  onDiscover?: (ticketId: string) => Promise<any>;
  onClaim?: (ticketId: string, prizeId: string) => Promise<void>;
  isProcessing?: boolean;
  className?: string;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket: initialTicket,
  onReveal,
  onDiscover,
  onClaim,
  isProcessing = false,
  className = ''
}) => {
  // Local ticket state to handle updates during component lifecycle
  const [ticket, setTicket] = useState(initialTicket);
  
  // Update local state when props change
  useEffect(() => {
    setTicket(initialTicket);
  }, [initialTicket]);
  
  // State to track flip animation - using local type definition
  const [isFlipped, setIsFlipped] = useState(!!ticket.reveal_time);
  const [flipDirection, setFlipDirection] = useState<LocalFlipDirection>('horizontal');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // State to track whether prize has been discovered - initialize safely
  const [isDiscovered, setIsDiscovered] = useState(!!ticket.discovered_prize);
  
  // Add new state for confetti control
  const [showConfetti, setShowConfetti] = useState(false);
  
  // State to store the discovered prize data
  const [discoveredPrize, setDiscoveredPrize] = useState<PrizeData | null>(
    ticket.discovered_prize || null
  );
  
  // Add ref to track card element
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Add state for card position and dimensions
  const [cardBounds, setCardBounds] = useState({
    x: 0, y: 0, width: 0, height: 0
  });

  // Determine confetti duration based on win type
  const confettiDuration = ticket.instant_win_eligible ? 5000 : 3000;

  // Add useEffect to manage confetti lifecycle
  useEffect(() => {
    if (showConfetti) {
      // Auto-disable confetti after duration
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, confettiDuration);
      
      return () => clearTimeout(timer);
    }
  }, [showConfetti, confettiDuration]);
  
  // Update card bounds when needed
  useEffect(() => {
    if (cardRef.current && showConfetti) {
      const bounds = cardRef.current.getBoundingClientRect();
      setCardBounds({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      });
    }
  }, [showConfetti]);

  // Handle reveal action
  const handleReveal = useCallback(async () => {
    if (isProcessing || isAnimating || !onReveal) return;
    
    try {
      setIsAnimating(true);
      await onReveal(ticket.ticket_id);
      setFlipDirection('horizontal');
      setIsFlipped(true);
      
      // Update local ticket state to reflect revealed status
      setTicket(prev => ({
        ...prev,
        is_revealed: true,
        reveal_time: new Date().toISOString()
      }));
      
      // Schedule confetti to start after flip animation completes
      setTimeout(() => {
        setShowConfetti(true);
      }, 800); // Match this with flip animation duration
    } finally {
      // Allow a small delay for animation to complete visually
      setTimeout(() => {
        setIsAnimating(false);
      }, 800);
    }
  }, [ticket.ticket_id, onReveal, isProcessing, isAnimating]);

  // Handle discover action - modified to use vertical-y flip and update discovered prize
  const handleDiscover = useCallback(async () => {
    if (isProcessing || isAnimating || !onDiscover) return;
    
    try {
      setIsAnimating(true);
      
      // Call API to discover prize
      const response = await onDiscover(ticket.ticket_id);
      
      // Debug what we're actually receiving
      console.log("Prize discovery response:", response);
      
      // More robust response handling
      if (response) {
        // Some API implementations might nest the prize data differently
        // Check for both common patterns
        const prizeData = response.prize || response;
        
        // Verify we have the required prize data structure before proceeding
        if (prizeData && (prizeData.instance_id || prizeData.name)) {
          // Store the prize data directly in state
          setDiscoveredPrize(prizeData);
          
          // Update local ticket state 
          setTicket(prev => ({
            ...prev,
            discovered_prize: prizeData
          }));
          
          // Set discovered state
          setIsDiscovered(true);
          
          // Use vertical-y flip direction for discover action
          setFlipDirection('vertical-y');
          
          // Schedule confetti to start after flip animation completes
          setTimeout(() => {
            setShowConfetti(true);
          }, 800);
          
          return; // Successfully handled the response
        }
      }
      
      // If we got here, something was wrong with the response structure
      console.error("Invalid prize discovery response format:", response);
    } catch (error) {
      console.error("Prize discovery failed:", error);
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
      }, 800);
    }
  }, [ticket.ticket_id, onDiscover, isProcessing, isAnimating]);

  // Handle claim action
  const handleClaim = useCallback(async (prizeId: string) => {
    if (isProcessing || isAnimating || !onClaim) return;
    
    try {
      setIsAnimating(true);
      await onClaim(ticket.ticket_id, prizeId);
      
      // Update local ticket state to reflect claimed status
      setTicket(prev => ({
        ...prev,
        claim_status: {
          claimed: true,
          claim_time: new Date().toISOString()
        }
      }));
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
      }, 800);
    }
  }, [ticket.ticket_id, onClaim, isProcessing, isAnimating]);

  // Determine which back face to show based on ticket properties
  const renderBackFace = () => {
    if (ticket.instant_win_eligible) {
      // First safely determine if we have prize data available
      const prizeData = discoveredPrize || ticket.discovered_prize;
      
      // Show discovered prize face if prize has been discovered AND we have prize data
      if ((isDiscovered || ticket.discovered_prize) && prizeData) {
        return (
          <DiscoveredInstantFace
            ticketNumber={ticket.ticket_number}
            purchaseDate={ticket.purchase_time}
            revealDate={ticket.reveal_time || new Date().toISOString()}
            prizeData={prizeData}
            onClaim={(prizeId) => handleClaim(prizeId)}
            isProcessing={isProcessing}
          />
        );
      }
      // Show standard instant win face
      return (
        <InstantWinFace
          ticketNumber={ticket.ticket_number}
          purchaseDate={ticket.purchase_time}
          revealDate={ticket.reveal_time || new Date().toISOString()}
          onDiscover={handleDiscover}
          isProcessing={isProcessing}
        />
      );
    } else {
      // No Instant Win case remains unchanged
      return (
        <NoInstantWinFace
          ticketNumber={ticket.ticket_number}
          raffleTitle={ticket.raffle_title}
          purchaseDate={ticket.purchase_time}
          revealDate={ticket.reveal_time || new Date().toISOString()}
          isDrawEnded={false}
          isRevealed={isFlipped}
        />
      );
    }
  };

  // Calculate the confetti position and parameters for explosion effect
  const renderCardCenteredConfetti = () => {
    if (!showConfetti || !cardBounds.width) return null;
    
    // Calculate center point of the card
    const centerX = cardBounds.x + cardBounds.width / 2;
    const centerY = cardBounds.y + cardBounds.height / 2;
    
    // Size multiplier for the explosion radius
    const sizeMultiplier = ticket.instant_win_eligible ? 2.5 : 1.5;
    const explosionWidth = cardBounds.width * sizeMultiplier;
    const explosionHeight = cardBounds.height * sizeMultiplier;
    
    // Positioning calculation to center the explosion
    const confettiX = centerX - (explosionWidth / 2);
    const confettiY = centerY - (explosionHeight / 2);
    
    return (
      <div className="confetti-container">
        <Confetti
          width={explosionWidth}
          height={explosionHeight}
          confettiSource={{
            x: explosionWidth / 2,
            y: explosionHeight / 2,
            w: 0,
            h: 0
          }}
          numberOfPieces={ticket.instant_win_eligible ? 200 : 75}
          recycle={false}
          colors={ticket.instant_win_eligible ? 
            ['#FFD700', '#4CAF50', '#FF5722', '#2196F3', '#FF9800', '#E91E63'] : 
            ['#818CF8', '#C7D2FE', '#4F46E5', '#A5B4FC']}
          gravity={0.05} // Reduced gravity to allow particles to travel further
          initialVelocityX={ticket.instant_win_eligible ? { min: -15, max: 15 } : { min: -10, max: 10 }}
          initialVelocityY={ticket.instant_win_eligible ? { min: -15, max: 15 } : { min: -10, max: 10 }}
          style={{
            position: 'absolute',
            left: confettiX,
            top: confettiY,
          }}
        />
      </div>
    );
  };

  return (
    <motion.div 
      ref={cardRef}
      className={`relative w-full h-full min-h-[140px] ${className}`}
      layoutId={`ticket-${ticket.ticket_id}`}
    >
      {/* Add card-centered confetti rendering */}
      {renderCardCenteredConfetti()}
      
      <CardContainer
        isFlipped={isFlipped}
        flipDirection={flipDirection as FlipDirection}
        className="w-full h-full"
      >
        {/* Front Face - Unrevealed Ticket */}
        <CardFace isFront={true} flipDirection={flipDirection as FlipDirection}>
          <UnrevealedFace
            ticketNumber={ticket.ticket_number}
            purchaseDate={ticket.purchase_time}
            onReveal={handleReveal}
            isProcessing={isProcessing || isAnimating}
          />
        </CardFace>

        {/* Back Face - Revealed Ticket (Instant Win, Discovered Prize, or No Instant Win) */}
        <CardFace isFront={false} flipDirection={flipDirection as FlipDirection}>
          {renderBackFace()}
        </CardFace>
      </CardContainer>
    </motion.div>
  );
};

export default TicketCard;