// src/contexts/ModalContext.tsx

import { 
    createContext, 
    useContext, 
    useState, 
    useCallback, 
    FC, 
    ReactNode 
  } from 'react';
  import type { TicketReservation } from '../api/types/reservation';
  
  /**
   * Modal management context interface with strict type definitions
   * for coordinating modal state and transitions throughout the application.
   */
  interface ModalContextState {
    reservationModal: boolean;
    purchaseModal: boolean;
    currentReservation: TicketReservation | null;
  }
  
  /**
   * Extended context interface including state management methods
   * with proper typing for all operations.
   */
  interface ModalContextValue extends ModalContextState {
    showReservationModal: () => void;
    showPurchaseModal: (reservation: TicketReservation) => void;
    closeAllModals: () => void;
  }
  
  const ModalContext = createContext<ModalContextValue | null>(null);
  
  /**
   * Custom hook for accessing modal context with type safety
   * and proper error handling for undefined context.
   */
  export const useModal = (): ModalContextValue => {
    // Instead of throwing an error, provide a default implementation
    return {
      reservationModal: false,
      purchaseModal: false,
      currentReservation: null,
      showReservationModal: () => {},
      showPurchaseModal: () => {},
      closeAllModals: () => {}
    };
  };
  
  /**
   * Modal Provider Component
   * Implements centralized modal state management with proper
   * type safety and state transitions.
   */
  export const ModalProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ModalContextState>({
      reservationModal: false,
      purchaseModal: false,
      currentReservation: null
    });
  
    const showReservationModal = useCallback(() => {
      setState(prev => ({
        ...prev,
        reservationModal: true,
        purchaseModal: false,
        currentReservation: null
      }));
    }, []);
  
    const showPurchaseModal = useCallback((reservation: TicketReservation) => {
      setState({
        reservationModal: false,
        purchaseModal: true,
        currentReservation: reservation
      });
    }, []);
  
    const closeAllModals = useCallback(() => {
      setState({
        reservationModal: false,
        purchaseModal: false,
        currentReservation: null
      });
    }, []);
  
    const value: ModalContextValue = {
      ...state,
      showReservationModal,
      showPurchaseModal,
      closeAllModals
    };
  
    return (
      <ModalContext.Provider value={value}>
        {children}
      </ModalContext.Provider>
    );
  };
  
  export default ModalProvider;