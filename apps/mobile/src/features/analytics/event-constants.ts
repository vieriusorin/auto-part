export const PHASE0_EVENT_NAMES = [
  'onboarding.started',
  'onboarding.completed',
  'vehicle.created',
  'maintenance_item.created',
  'reminder.created',
  'reminder.triggered',
  'maintenance_action.completed',
  'paywall.viewed',
  'trial.started',
  'subscription.started',
  'subscription.canceled',
  'churn.signal_detected',
] as const

export type Phase0EventName = (typeof PHASE0_EVENT_NAMES)[number]

export const REQUIRED_EVENT_PROPERTIES = [
  'event_id',
  'event_name',
  'occurred_at_client',
  'session_id',
  'device_id',
  'platform',
  'country',
  'channel',
  'app_version',
  'schema_version',
] as const
