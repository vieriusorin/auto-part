import type {
  SpendKpisResponseData,
  SubscriptionRetentionSummaryResponseDataSchema,
} from '@autocare/shared'
import type { infer as ZodInfer } from 'zod'
import type { ReportResourceScope } from './report-access-scope.js'

type SubscriptionRetentionSummaryResponseData = ZodInfer<
  typeof SubscriptionRetentionSummaryResponseDataSchema
>

const redactSpendKpisForNonElevated = (data: SpendKpisResponseData): SpendKpisResponseData => ({
  ...data,
  byVehicle: [],
  advanced: {
    ...data.advanced,
    anomalies: [],
  },
})

const redactRetentionSummaryForNonElevated = (
  data: SubscriptionRetentionSummaryResponseData,
): SubscriptionRetentionSummaryResponseData => ({
  ...data,
  sampleSize: {
    ...data.sampleSize,
    paywallViews: 0,
    trialStarts: 0,
    paidConversions: 0,
  },
  notes: [
    'Detailed sample size fields are hidden for non-elevated report readers.',
    ...data.notes.filter((note: string) => !note.includes('sample size')),
  ],
})

export const filterSpendKpisResponse = (
  scope: ReportResourceScope,
  data: SpendKpisResponseData,
): SpendKpisResponseData => (scope.isElevated ? data : redactSpendKpisForNonElevated(data))

export const filterSubscriptionRetentionResponse = (
  scope: ReportResourceScope,
  data: SubscriptionRetentionSummaryResponseData,
): SubscriptionRetentionSummaryResponseData =>
  scope.isElevated ? data : redactRetentionSummaryForNonElevated(data)

