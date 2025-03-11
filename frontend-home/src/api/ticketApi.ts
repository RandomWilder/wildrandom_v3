/**
* Ticket Gameplay Service Integration
* 
* Orchestrates core gameplay mechanics with:
* - Authenticated ticket operations
* - Real-time state synchronization
* - Optimistic updates with fallbacks
* - Progressive reveal sequences
*/

import axiosInstance from './client';
import { type AxiosError } from 'axios';
import type { 
  TicketResponse,
  BatchTicketResponse,
  RevealRequest,
  DiscoverRequest,
  ClaimRequest,
  TicketFilters,
  TicketSort,
  MyTicketsResponse,
  Ticket
} from '../features/tickets/types';


interface ApiResponse<T> {
 data?: T;
 error?: {
   code: string;
   message: string;
   details?: Record<string, unknown>;
 };
}

enum TicketErrorCode {
 INVALID_TICKET = 'INVALID_TICKET',
 TICKET_EXPIRED = 'TICKET_EXPIRED',
 ALREADY_REVEALED = 'ALREADY_REVEALED',
 ALREADY_CLAIMED = 'ALREADY_CLAIMED',
 OPERATION_IN_PROGRESS = 'OPERATION_IN_PROGRESS',
 NETWORK_ERROR = 'NETWORK_ERROR',
 SESSION_EXPIRED = 'SESSION_EXPIRED',
 INVALID_RESPONSE = 'INVALID_RESPONSE'
}

class TicketApi {
 private static instance: TicketApi;
 private readonly activeOperations: Set<string> = new Set();
 private readonly operationTimeouts: Map<string, NodeJS.Timeout> = new Map();
 
 private readonly BASE_PATH = '/api/raffles';
 private readonly MY_TICKETS_ENDPOINT = '/api/raffles/my-tickets';
 private readonly OPERATION_TIMEOUT = 30000; // 30 seconds
 private readonly STALE_THRESHOLD = 30000;   // 30 seconds

 private constructor() {
   setInterval(this.clearStaleOperations.bind(this), this.STALE_THRESHOLD);
 }

 static getInstance(): TicketApi {
   if (!TicketApi.instance) {
     TicketApi.instance = new TicketApi();
   }
   return TicketApi.instance;
 }

 /**
  * Fetches player's active tickets with filtering and sorting
  * 
  * @param filters - Optional filter criteria including raffleId
  * @param sort - Optional sort configuration
  * @returns Promise with tickets response
  */
 async getTickets(
   filters?: TicketFilters,
   sort?: TicketSort
 ): Promise<ApiResponse<MyTicketsResponse>> {
   try {
     const { data } = await axiosInstance.get(this.MY_TICKETS_ENDPOINT, {
       params: {
         ...filters,
         raffle_id: filters?.raffleId, // Support filtering by raffle ID
         sort: sort ? `${sort.field}:${sort.ascending ? 'asc' : 'desc'}` : undefined
       }
     });

     if (!this.validateTicketsResponse(data)) {
       throw new Error('Invalid tickets response format');
     }

     return { data };
   } catch (error) {
     return this.handleError(error);
   }
 }

 /**
  * Processes batch reveal operations with animation coordination
  */
 async revealTickets(request: RevealRequest): Promise<ApiResponse<BatchTicketResponse>> {
   return this.executeOperation(
     'reveal',
     request.ticketIds,
     async () => {
       const { data } = await axiosInstance.post(
         `${this.BASE_PATH}/${request.raffleId}/tickets/reveal`,
         request
       );
       return data;
     }
   );
 }

 /**
  * Handles prize discovery sequence with anticipation building
  */
 async discoverPrize(request: DiscoverRequest): Promise<ApiResponse<TicketResponse>> {
   return this.executeOperation(
     'discover',
     [request.ticketId],
     async () => {
       const { data } = await axiosInstance.post(
         `${this.BASE_PATH}/${request.raffleId}/tickets/${request.ticketId}/discover`,
         request
       );
       return data;
     }
   );
 }

 /**
  * Processes prize claim sequence with celebration triggers
  */
 async claimPrize(request: ClaimRequest): Promise<ApiResponse<TicketResponse>> {
   return this.executeOperation(
     'claim',
     [request.ticketId],
     async () => {
       const { data } = await axiosInstance.post(
         `${this.BASE_PATH}/${request.raffleId}/tickets/${request.ticketId}/claim`,
         request
       );
       return data;
     }
   );
 }

 /**
  * Creates unique operation keys for deduplication
  */
 private createOperationKey(operation: string, identifiers: string[]): string {
   return `${operation}:${identifiers.join(':')}:${Date.now()}`;
 }

 /**
  * Executes gameplay operations with proper state tracking
  */
 private async executeOperation<T>(
   operation: string,
   identifiers: string[],
   executor: () => Promise<T>
 ): Promise<ApiResponse<T>> {
   const operationKey = this.createOperationKey(operation, identifiers);
   
   if (this.activeOperations.has(operationKey)) {
     return {
       error: {
         code: TicketErrorCode.OPERATION_IN_PROGRESS,
         message: `${operation} operation in progress`
       }
     };
   }

   try {
     this.activeOperations.add(operationKey);
     const timeout = setTimeout(() => {
       this.activeOperations.delete(operationKey);
     }, this.OPERATION_TIMEOUT);
     this.operationTimeouts.set(operationKey, timeout);

     const response = await executor();
     return { data: response };
   } catch (error) {
     return this.handleError(error);
   } finally {
     this.cleanupOperation(operationKey);
   }
 }

 /**
  * Validates response integrity for gameplay consistency
  */
 private validateTicketsResponse(response: unknown): response is MyTicketsResponse {
   if (!response || typeof response !== 'object') return false;
   
   return Object.entries(response).every(([_, data]) => (
     typeof data === 'object' &&
     data !== null &&
     'raffle' in data &&
     'tickets' in data &&
     Array.isArray(data.tickets) &&
     data.tickets.every((ticket: Ticket) => 
       'ticket_id' in ticket &&
       'status' in ticket &&
       'is_revealed' in ticket
     )
   ));
 }

 /**
  * Manages cleanup of stale operations
  */
 private clearStaleOperations(): void {
   const now = Date.now();
   
   for (const [key, timeout] of this.operationTimeouts) {
     clearTimeout(timeout);
     if (this.activeOperations.has(key)) {
       const [, , timestamp] = key.split(':');
       if (now - Number(timestamp) > this.STALE_THRESHOLD) {
         this.cleanupOperation(key);
       }
     }
   }
 }

 /**
  * Handles operation cleanup with proper timeout management
  */
 private cleanupOperation(operationKey: string): void {
   this.activeOperations.delete(operationKey);
   const timeout = this.operationTimeouts.get(operationKey);
   if (timeout) {
     clearTimeout(timeout);
     this.operationTimeouts.delete(operationKey);
   }
 }

 /**
  * Provides enhanced error handling with gameplay context
  */
 private handleError(error: unknown): ApiResponse<never> {
  // Type guard for axios errors
  const isAxiosError = (err: unknown): err is AxiosError<{ 
    error: string; 
    details?: Record<string, unknown>;
  }> => {
    return (
      typeof err === 'object' &&
      err !== null &&
      'isAxiosError' in err &&
      err.isAxiosError === true
    );
  };

  if (isAxiosError(error)) {
    // Session expiry - trigger re-authentication flow
    if (error.response?.status === 401) {
      return {
        error: {
          code: TicketErrorCode.SESSION_EXPIRED,
          message: 'Your session has expired. Please sign in to continue playing.'
        }
      };
    }

    // Connection issues - guide player to check connectivity
    if (!error.response) {
      return {
        error: {
          code: TicketErrorCode.NETWORK_ERROR,
          message: 'Unable to connect to game server. Please check your connection.'
        }
      };
    }

    // Map API errors to gameplay context
    const responseData = error.response.data;
    return {
      error: {
        code: responseData?.error || 'UNKNOWN_ERROR',
        message: responseData?.error || 'An unexpected error occurred',
        details: responseData?.details
      }
    };
  }

  // Generic error with gameplay context
  return {
    error: {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? 
        error.message : 
        'Something went wrong. Please try again.'
    }
  };
}
}

export default TicketApi.getInstance();