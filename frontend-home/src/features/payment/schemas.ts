/**
 * Payment Schema Definitions
 * Zod schemas for runtime validation aligned with backend contracts
 */

import { z } from 'zod';
import { PurchaseErrorCode, PurchaseStatus } from './types';

export const siteCreditBalanceSchema = z.object({
  user_id: z.number(),
  available_amount: z.number().min(0),
  pending_amount: z.number().min(0),
  last_updated: z.string().datetime()
});

export const purchaseErrorSchema = z.object({
  code: z.nativeEnum(PurchaseErrorCode),
  message: z.string(),
  details: z.record(z.unknown()).optional()
});

export const purchaseRequestSchema = z.object({
  reservation_id: z.number().positive()
});

export const purchaseTransactionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: z.enum(['debit', 'credit']),
  amount: z.number().positive(),
  balance_after: z.number().nullable(),
  status: z.nativeEnum(PurchaseStatus),
  reference_type: z.string(),
  reference_id: z.string(),
  meta_data: z.object({
    reservation_id: z.number().optional(),
    ticket_ids: z.array(z.string()).optional(),
    failure_reason: z.string().optional()
  }).optional(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable()
});

export const purchaseResponseSchema = z.object({
  transaction: purchaseTransactionSchema,
  message: z.string(),
  tickets: z.array(z.string()),
  total_amount: z.number(),
  new_balance: z.number()
});