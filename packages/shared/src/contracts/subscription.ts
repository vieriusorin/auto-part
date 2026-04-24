import { z } from 'zod'
import { PlanTierSchema } from './auth.js'

export const BillingCycleSchema = z.enum(['monthly', 'annual'])
export type BillingCycle = z.infer<typeof BillingCycleSchema>

export const PaywallOfferSchema = z.object({
  id: z.string().min(1),
  plan: PlanTierSchema,
  billingCycle: BillingCycleSchema,
  priceCents: z.number().int().nonnegative(),
  trialDays: z.number().int().nonnegative(),
  highlighted: z.boolean().default(false),
})

export const SubscriptionStatusResponseDataSchema = z.object({
  organizationPlan: PlanTierSchema,
  effectivePlan: PlanTierSchema,
  trialActive: z.boolean(),
  trialEndsAt: z.string().datetime().nullable(),
  paywallEligible: z.boolean(),
  paywallReason: z.string().min(1),
})

export const ListPaywallOffersResponseDataSchema = z.object({
  items: z.array(PaywallOfferSchema),
  variant: z.string().min(1),
})

export const StartTrialBodySchema = z.object({
  billingCycle: BillingCycleSchema,
  variant: z.string().min(1).optional(),
})

export const StartTrialResponseDataSchema = z.object({
  started: z.literal(true),
  plan: PlanTierSchema,
  billingCycle: BillingCycleSchema,
  trialEndsAt: z.string().datetime(),
})

export const MarkMonth2ActiveResponseDataSchema = z.object({
  recorded: z.literal(true),
})

export const CancelSubscriptionBodySchema = z.object({
  reason: z.string().min(2).max(120),
  feedback: z.string().max(500).optional(),
})

export const CancelSubscriptionResponseDataSchema = z.object({
  canceled: z.literal(true),
  effectivePlan: PlanTierSchema,
  recordedReason: z.string().min(2),
})

export const SubscriptionCancelReasonItemSchema = z.object({
  reason: z.string().min(1),
  count: z.number().int().nonnegative(),
})

export const ListSubscriptionCancelReasonsResponseDataSchema = z.object({
  items: z.array(SubscriptionCancelReasonItemSchema),
})

export const SubscriptionRetentionSummaryResponseDataSchema = z.object({
  trialStartRatePercent: z.number(),
  trialToPaidPercent: z.number(),
  month2PayerRetentionPercent: z.number(),
  refundRatePercent: z.number(),
  freeTierD30RetentionDeltaPercent: z.number(),
  confidence: z.object({
    trialStartRate: z.enum(['low', 'medium', 'high']),
    trialToPaidRate: z.enum(['low', 'medium', 'high']),
    payerLifecycleRates: z.enum(['low', 'medium', 'high']),
    freeTierD30Delta: z.enum(['low', 'medium', 'high']),
  }),
  sampleSize: z.object({
    paywallViews: z.number().int().nonnegative(),
    trialStarts: z.number().int().nonnegative(),
    paidConversions: z.number().int().nonnegative(),
    lowSampleThreshold: z.number().int().positive(),
  }),
  notes: z.array(z.string()),
})
