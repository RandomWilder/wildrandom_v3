/**
 * Validation schemas for ticket operations and state transitions.
 * Implements strict validation patterns for user interactions and data flow.
 */

import { z } from 'zod';
import { TicketStatus, PrizeType, PrizeValueType } from './types';

// Prize Value Validation
export const prizeValuesSchema = z.object({
  [PrizeValueType.CASH]: z.number().min(0),
  [PrizeValueType.CREDIT]: z.number().min(0),
  [PrizeValueType.RETAIL]: z.number().min(0)
}).strict();

// Prize Schema
export const prizeSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(PrizeType),
  values: prizeValuesSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  claimDeadline: z.string().datetime().optional()
}).strict();

// Core Ticket Validation
export const ticketSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string().regex(/^[A-Z0-9]{8,}$/),
  raffleId: z.number().positive(),
  status: z.nativeEnum(TicketStatus),
  purchaseTime: z.string().datetime(),
  expiryTime: z.string().datetime().optional(),
  revealTime: z.string().datetime().optional(),
  prize: prizeSchema.optional(),
  transactionId: z.string().optional()
}).strict();

// Batch Operation Schemas
export const revealRequestSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1).max(50),
  parallel: z.boolean().default(true)
}).strict();

export const discoverRequestSchema = z.object({
  ticketId: z.string().uuid(),
  verificationToken: z.string()
}).strict();

export const claimRequestSchema = z.object({
  ticketId: z.string().uuid(),
  prizeId: z.string().uuid(),
  claimMethod: z.enum(['CREDIT', 'BANK_TRANSFER']),
  acceptedTerms: z.literal(true)
}).strict();

// Filter and Sort Validation
export const timeRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime()
}).refine(data => new Date(data.start) < new Date(data.end), {
  message: "End time must be after start time"
});

export const filterSchema = z.object({
  status: z.array(z.nativeEnum(TicketStatus)).optional(),
  raffleId: z.number().positive().optional(),
  prizeType: z.array(z.nativeEnum(PrizeType)).optional(),
  timeRange: timeRangeSchema.optional()
}).strict();

export const sortSchema = z.object({
  field: z.enum(['purchaseTime', 'revealTime', 'ticketNumber', 'prizeValue']),
  ascending: z.boolean()
}).strict();

// Response Validation
export const operationSchema = z.object({
  ticketId: z.string().uuid(),
  isProcessing: z.boolean(),
  error: z.string().optional()
}).strict();

export const batchOperationSchema = z.object({
  ticketIds: z.array(z.string().uuid()),
  processedCount: z.number().min(0),
  failedIds: z.array(z.string().uuid()),
  isProcessing: z.boolean(),
  error: z.string().optional()
}).strict();

// Animation State Validation
export const animationStateSchema = z.object({
  isRevealing: z.boolean(),
  isDiscovering: z.boolean(),
  isClaiming: z.boolean(),
  completedAnimations: z.array(z.string().uuid())
}).strict();

// Type inference helpers
export type RevealRequest = z.infer<typeof revealRequestSchema>;
export type DiscoverRequest = z.infer<typeof discoverRequestSchema>;
export type ClaimRequest = z.infer<typeof claimRequestSchema>;
export type FilterRequest = z.infer<typeof filterSchema>;
export type SortRequest = z.infer<typeof sortSchema>;

// Validation helpers
export const validateTicket = (data: unknown) => ticketSchema.parse(data);
export const validateRevealRequest = (data: unknown) => revealRequestSchema.parse(data);
export const validateDiscoverRequest = (data: unknown) => discoverRequestSchema.parse(data);
export const validateClaimRequest = (data: unknown) => claimRequestSchema.parse(data);