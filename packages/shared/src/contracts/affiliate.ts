import { z } from 'zod'

export const AffiliateIntentSurfaceSchema = z.enum([
  'maintenance_due',
  'service_report_ready',
  'cost_anomaly_detected',
])
export type AffiliateIntentSurface = z.infer<typeof AffiliateIntentSurfaceSchema>

export const AffiliateOfferSchema = z.object({
  id: z.string().min(1),
  partnerName: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  intentSurface: AffiliateIntentSurfaceSchema,
  targetUrl: z.string().url(),
  disclosureLabel: z.literal('Sponsored recommendation'),
})

export const ListAffiliateOffersQuerySchema = z.object({
  intentSurface: AffiliateIntentSurfaceSchema.optional(),
})

export const ListAffiliateOffersResponseDataSchema = z.object({
  items: z.array(AffiliateOfferSchema),
})

export const TrackAffiliateClickBodySchema = z.object({
  offerId: z.string().min(1),
  intentSurface: AffiliateIntentSurfaceSchema,
  disclosed: z.boolean(),
  consentGranted: z.boolean().default(false),
})

export const TrackAffiliateClickResponseDataSchema = z.object({
  recorded: z.literal(true),
  attributed: z.boolean(),
  disclosureAccepted: z.literal(true),
})

export const TrackAffiliateExposureBodySchema = z.object({
  offerId: z.string().min(1),
  intentSurface: AffiliateIntentSurfaceSchema,
  disclosed: z.boolean(),
})

export const TrackAffiliateExposureResponseDataSchema = z.object({
  recorded: z.literal(true),
  disclosureAccepted: z.boolean(),
})

export const ReportAffiliateComplaintBodySchema = z.object({
  reason: z.string().min(2).max(160),
  offerId: z.string().min(1).optional(),
  intentSurface: AffiliateIntentSurfaceSchema.optional(),
  disclosureVisible: z.boolean(),
})

export const ReportAffiliateComplaintResponseDataSchema = z.object({
  recorded: z.literal(true),
})

export const AffiliateIntentMetricsItemSchema = z.object({
  intentSurface: AffiliateIntentSurfaceSchema,
  clicks: z.number().int().nonnegative(),
  attributedClicks: z.number().int().nonnegative(),
})

export const AffiliateCategoryMetricsItemSchema = z.object({
  category: z.string().min(1),
  clicks: z.number().int().nonnegative(),
  attributedClicks: z.number().int().nonnegative(),
})

const AdminAudienceMetaSchema = z.object({
  audience: z.literal('admin'),
})

export const AffiliateMetricsResponseDataSchema = z.object({
  meta: AdminAudienceMetaSchema,
  totals: z.object({
    clicks: z.number().int().nonnegative(),
    attributedClicks: z.number().int().nonnegative(),
  }),
  byIntentSurface: z.array(AffiliateIntentMetricsItemSchema),
  byCategory: z.array(AffiliateCategoryMetricsItemSchema),
})

export const AffiliateImpactResponseDataSchema = z.object({
  meta: AdminAudienceMetaSchema,
  totals: z.object({
    exposures: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative(),
    attributedClicks: z.number().int().nonnegative(),
    complaints: z.number().int().nonnegative(),
  }),
  complaintRatePercent: z.number(),
})

export const AffiliateDashboardQuerySchema = z.object({
  country: z.string().length(2).optional(),
  platform: z.enum(['ios', 'android']).optional(),
  channel: z.string().min(1).optional(),
})

export const AffiliatePartnerDashboardItemSchema = z.object({
  partnerName: z.string().min(1),
  offerId: z.string().min(1),
  intentSurface: AffiliateIntentSurfaceSchema,
  category: z.string().min(1),
  exposures: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  attributedClicks: z.number().int().nonnegative(),
  clickThroughPercent: z.number(),
  attributionRatePercent: z.number(),
})

export const AffiliateTrustSegmentItemSchema = z.object({
  segmentKey: z.string().min(1),
  exposures: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  complaints: z.number().int().nonnegative(),
  complaintRatePercent: z.number(),
})

export const AffiliateDashboardResponseDataSchema = z.object({
  meta: AdminAudienceMetaSchema,
  totals: z.object({
    exposures: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative(),
    attributedClicks: z.number().int().nonnegative(),
    complaints: z.number().int().nonnegative(),
  }),
  partners: z.array(AffiliatePartnerDashboardItemSchema),
  trustBySegment: z.array(AffiliateTrustSegmentItemSchema),
})

export const AffiliateTrendGranularitySchema = z.enum(['day', 'week'])

export const AffiliateTrendsQuerySchema = z.object({
  granularity: AffiliateTrendGranularitySchema.optional(),
  country: z.string().length(2).optional(),
  platform: z.enum(['ios', 'android']).optional(),
  channel: z.string().min(1).optional(),
})

export const AffiliateTrendBucketSchema = z.object({
  bucketStart: z.string().datetime(),
  exposures: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  attributedClicks: z.number().int().nonnegative(),
  complaints: z.number().int().nonnegative(),
  clickThroughPercent: z.number(),
  attributionRatePercent: z.number(),
  complaintRatePercent: z.number(),
})

export const AffiliateTrendsResponseDataSchema = z.object({
  meta: AdminAudienceMetaSchema,
  granularity: AffiliateTrendGranularitySchema,
  buckets: z.array(AffiliateTrendBucketSchema),
})

export const AffiliateKpiGatesQuerySchema = z.object({
  country: z.string().length(2).optional(),
  platform: z.enum(['ios', 'android']).optional(),
  channel: z.string().min(1).optional(),
})

export const AffiliateDisclosureAuditQuerySchema = z.object({
  country: z.string().length(2).optional(),
  platform: z.enum(['ios', 'android']).optional(),
  channel: z.string().min(1).optional(),
})

export const AffiliateDisclosureAuditResponseDataSchema = z.object({
  meta: AdminAudienceMetaSchema,
  totals: z.object({
    trackedInteractions: z.number().int().nonnegative(),
    compliantInteractions: z.number().int().nonnegative(),
    violations: z.number().int().nonnegative(),
  }),
  disclosureCompliancePercent: z.number(),
  checkpoint: z.object({
    disclosureComplianceFull: z.boolean(),
  }),
})

export const AffiliateKpiGatesResponseDataSchema = z.object({
  meta: AdminAudienceMetaSchema,
  snapshot: z.object({
    exposures: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative(),
    attributedClicks: z.number().int().nonnegative(),
    complaints: z.number().int().nonnegative(),
    ctrPercent: z.number(),
    clickToConversionProxyPercent: z.number(),
    complaintRatePercent: z.number(),
    retentionGuardProxyPercent: z.number(),
  }),
  checkpoints: z.object({
    ctrAtLeast3Percent: z.boolean(),
    conversionProxyAtLeast5Percent: z.boolean(),
    complaintRateUnder1Percent: z.boolean(),
    retentionGuardProxyAtLeast95Percent: z.boolean(),
  }),
})

export const AffiliatePhaseExitCriterionSchema = z.object({
  key: z.enum([
    'ctr_at_least_3_percent',
    'conversion_at_least_5_percent',
    'disclosure_compliance_full',
    'no_retention_decline_detected',
    'hidden_sponsorship_complaints_below_1_percent',
  ]),
  passed: z.boolean(),
  value: z.number().optional(),
  threshold: z.number().optional(),
  reason: z.string().optional(),
})

export const AffiliatePhaseExitReadinessResponseDataSchema = z.object({
  meta: AdminAudienceMetaSchema,
  ready: z.boolean(),
  criteria: z.array(AffiliatePhaseExitCriterionSchema),
  missingEvidence: z.array(z.string()),
})
