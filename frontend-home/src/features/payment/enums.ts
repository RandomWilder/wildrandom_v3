/**
 * Payment Flow Enumerations
 * 
 * Centralizes payment-related enumerations to maintain consistency
 * across the purchase flow implementation. These enums are designed
 * to align with backend service contracts while providing type safety
 * and clear state management on the frontend.
 * 
 * @module features/payment/enums
 */

// #region Flow Control
/**
 * Purchase flow step enumeration
 * Represents the distinct states in the purchase lifecycle
 * 
 * Implementation Notes:
 * - Aligns with PurchaseFlowState transitions
 * - Maps to UI component rendering logic
 * - Supports error boundary integration
 */
export enum PurchaseStep {
    BALANCE_CHECK = 'BALANCE_CHECK',  // Initial balance verification
    PROCESSING = 'PROCESSING',        // Transaction in progress
    CONFIRMATION = 'CONFIRMATION',    // Success state
    ERROR = 'ERROR'                   // Error boundary state
  }
  
  // #region Transaction States
  /**
   * Purchase status enumeration
   * Reflects backend transaction states for frontend display
   * 
   * Implementation Notes:
   * - Mirrors PaymentService transaction states
   * - Supports optimistic UI updates
   * - Enables proper error recovery flows
   */
  export enum PurchaseStatus {
    PENDING = 'pending',         // Initial state
    PROCESSING = 'processing',   // In-flight transaction
    COMPLETED = 'completed',     // Successfully processed
    FAILED = 'failed',          // Terminal failure state
    ROLLED_BACK = 'rolled_back' // Compensating transaction applied
  }
  
  // #region Error Classification
  /**
   * Purchase error classification
   * Categorizes errors for appropriate UI handling
   * 
   * Implementation Notes:
   * - Maps to backend error responses
   * - Supports i18n error messages
   * - Enables contextual error recovery
   */
  export enum PurchaseErrorCode {
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',  // Balance validation failure
    RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',    // Timing constraint violation
    TRANSACTION_FAILED = 'TRANSACTION_FAILED',      // Processing failure
    NETWORK_ERROR = 'NETWORK_ERROR',               // Communication failure
    INVALID_STATE = 'INVALID_STATE'                // State machine violation
  }
  
  // #region Transaction Types
  /**
   * Transaction type classification
   * Distinguishes between different transaction categories
   * 
   * Implementation Notes:
   * - Aligns with payment service reference types
   * - Supports audit logging requirements
   * - Enables transaction filtering
   */
  export enum TransactionType {
    TICKET_PURCHASE = 'ticket_purchase',  // Standard ticket purchase
    PRIZE_CLAIM = 'prize_claim',         // Prize redemption credit
    REFUND = 'refund',                  // Purchase reversal
    ADJUSTMENT = 'adjustment'           // Administrative modification
  }