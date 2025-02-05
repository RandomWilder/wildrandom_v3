import { z } from 'zod';
import { PurchaseErrorCode, PurchaseStatus } from './types';

/**
 * Payment Validation Schemas
 * Defines Zod schemas for runtime validation of payment-related data structures
 * with strict alignment to backend API contracts.
 */

// #region Core Schema Definitions
/**
 * Balance validation schema enforcing numeric constraints
 * and proper decimal handling for monetary values
 */
export const siteCreditBalanceSchema = z.object({
  available_amount: z.number()
    .nonnegative()
    .transform(n => Number(n.toFixed(2))),
  pending_amount: z.number()
    .nonnegative()
    .transform(n => Number(n.toFixed(2))),
  last_updated: z.string().datetime()
});

/**
 * Transaction metadata schema with optional fields
 * matching backend data structure
 */
export const transactionMetadataSchema = z.object({
  reservation_id: z.number().optional(),
  ticket_ids: z.array(z.string()).optional(),
  failure_reason: z.string().optional(),
  rollback_reason: z.string().optional()
});

/**
 * Purchase transaction schema with comprehensive validation
 * aligned with backend transaction model
 */
export const purchaseTransactionSchema = z.object({
  id: z.number().positive(),
  user_id: z.number().positive(),
  type: z.enum(['debit', 'credit']),
  amount: z.number()
    .positive()
    .transform(n => Number(n.toFixed(2))),
  balance_after: z.number()
    .nullable()
    .transform(n => n === null ? null : Number(n.toFixed(2))),
  status: z.nativeEnum(PurchaseStatus),
  reference_type: z.enum([
    'ticket_purchase',
    'prize_claim',
    'refund',
    'adjustment'
  ]),
  reference_id: z.string(),
  meta_data: transactionMetadataSchema.optional(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().optional()
});

// #region API Request/Response Schemas
/**
 * Purchase request validation schema
 * with reservation ID validation
 */
export const purchaseRequestSchema = z.object({
  reservation_id: z.number().positive()
});

/**
 * Purchase response validation schema
 * ensuring proper structure and data types
 */
export const purchaseResponseSchema = z.object({
  transaction: purchaseTransactionSchema,
  message: z.string(),
  tickets: z.array(z.string()),
  total_amount: z.number()
    .positive()
    .transform(n => Number(n.toFixed(2))),
  new_balance: z.number()
    .nonnegative()
    .transform(n => Number(n.toFixed(2)))
});

// #region Error Handling Schemas
/**
 * Purchase error validation schema
 * with strict error code enumeration
 */
export const purchaseErrorSchema = z.object({
  code: z.nativeEnum(PurchaseErrorCode),
  message: z.string(),
  details: z.record(z.unknown()).optional()
});

// #region Type Inference
/**
 * Type inference from schemas for runtime validation
 */
export type SiteCreditBalanceSchemaType = z.infer<typeof siteCreditBalanceSchema>;
export type PurchaseTransactionSchemaType = z.infer<typeof purchaseTransactionSchema>;
export type PurchaseRequestSchemaType = z.infer<typeof purchaseRequestSchema>;
export type PurchaseResponseSchemaType = z.infer<typeof purchaseResponseSchema>;
export type PurchaseErrorSchemaType = z.infer<typeof purchaseErrorSchema>;