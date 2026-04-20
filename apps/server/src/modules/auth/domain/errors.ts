export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'email_already_registered'
  | 'weak_password'
  | 'refresh_token_invalid'
  | 'refresh_token_reused'
  | 'refresh_token_expired'
  | 'session_expired'
  | 'not_authenticated'
  | 'csrf_required'
  | 'csrf_invalid'
  | 'social_auth_disabled'
  | 'social_auth_code_invalid'
  | 'social_auth_email_unverified'
  | 'invite_invalid'
  | 'invite_expired'
  | 'invite_revoked'
  | 'invite_email_mismatch'
  | 'invite_forbidden'
  | 'invite_organization_conflict'
  | 'invite_resend_cooldown'

export class AuthError extends Error {
  public readonly code: AuthErrorCode
  public readonly status: number

  constructor(code: AuthErrorCode, message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.status = status
  }
}

export const invalidCredentials = (): AuthError =>
  new AuthError('invalid_credentials', 'Invalid email or password', 401)

export const accountLocked = (retryAfterMinutes: number): AuthError =>
  new AuthError(
    'account_locked',
    `Account temporarily locked. Try again in ${retryAfterMinutes} minutes.`,
    423,
  )

export const emailAlreadyRegistered = (): AuthError =>
  new AuthError('email_already_registered', 'An account with this email already exists', 409)

export const weakPassword = (message: string): AuthError =>
  new AuthError('weak_password', message, 400)

export const refreshTokenInvalid = (): AuthError =>
  new AuthError('refresh_token_invalid', 'Refresh token is invalid', 401)

export const refreshTokenReused = (): AuthError =>
  new AuthError('refresh_token_reused', 'Refresh token reuse detected. Session terminated.', 401)

export const refreshTokenExpired = (): AuthError =>
  new AuthError('refresh_token_expired', 'Refresh token expired', 401)

export const sessionExpired = (): AuthError =>
  new AuthError('session_expired', 'Session expired. Please sign in again.', 401)

export const notAuthenticated = (): AuthError =>
  new AuthError('not_authenticated', 'Authentication required', 401)

export const csrfRequired = (): AuthError =>
  new AuthError('csrf_required', 'CSRF token required', 403)

export const csrfInvalid = (): AuthError => new AuthError('csrf_invalid', 'CSRF token invalid', 403)

export const socialAuthDisabled = (): AuthError =>
  new AuthError('social_auth_disabled', 'Social authentication is not enabled', 503)

export const socialAuthCodeInvalid = (): AuthError =>
  new AuthError('social_auth_code_invalid', 'Social authentication code is invalid', 401)

export const socialAuthEmailUnverified = (): AuthError =>
  new AuthError(
    'social_auth_email_unverified',
    'Social account email must be verified by provider',
    403,
  )

export const inviteInvalid = (): AuthError =>
  new AuthError('invite_invalid', 'Invite token is invalid', 404)

export const inviteExpired = (): AuthError =>
  new AuthError('invite_expired', 'Invite has expired', 410)

export const inviteRevoked = (): AuthError =>
  new AuthError('invite_revoked', 'Invite has been revoked', 410)

export const inviteEmailMismatch = (): AuthError =>
  new AuthError(
    'invite_email_mismatch',
    'Invite email does not match authenticated account',
    403,
  )

export const inviteForbidden = (): AuthError =>
  new AuthError('invite_forbidden', 'Insufficient permissions to manage invites', 403)

export const inviteOrganizationConflict = (): AuthError =>
  new AuthError(
    'invite_organization_conflict',
    'Account already belongs to a different organization',
    409,
  )

export const inviteResendCooldown = (): AuthError =>
  new AuthError(
    'invite_resend_cooldown',
    'Invite was recently sent. Please wait before resending.',
    429,
  )
