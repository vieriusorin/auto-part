import { socialAuthCodeInvalid, socialAuthEmailUnverified } from '../domain/errors.js'

export type GoogleOauthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export type GoogleIdentity = {
  email: string
}

export type GoogleOauthClient = {
  createAuthorizationUrl: () => string
  exchangeCodeForIdentity: (code: string, redirectUri?: string) => Promise<GoogleIdentity>
}

type GoogleTokenResponse = {
  access_token?: string
}

type GoogleUserInfoResponse = {
  email?: string
  email_verified?: boolean
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USER_INFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

export const createGoogleOauthClient = (config: GoogleOauthConfig): GoogleOauthClient => {
  const createAuthorizationUrl = (): string => {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    })
    return `${GOOGLE_AUTH_URL}?${params.toString()}`
  }

  const exchangeCodeForIdentity = async (
    code: string,
    redirectUri?: string,
  ): Promise<GoogleIdentity> => {
    const tokenBody = new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri ?? config.redirectUri,
      grant_type: 'authorization_code',
    })

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    })
    if (!tokenRes.ok) {
      throw socialAuthCodeInvalid()
    }
    const tokenData = (await tokenRes.json()) as GoogleTokenResponse
    const accessToken = tokenData.access_token
    if (!accessToken) {
      throw socialAuthCodeInvalid()
    }

    const userInfoRes = await fetch(GOOGLE_USER_INFO_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!userInfoRes.ok) {
      throw socialAuthCodeInvalid()
    }
    const profile = (await userInfoRes.json()) as GoogleUserInfoResponse
    if (!profile.email || typeof profile.email_verified !== 'boolean') {
      throw socialAuthCodeInvalid()
    }
    if (!profile.email_verified) {
      throw socialAuthEmailUnverified()
    }

    return {
      email: profile.email.trim().toLowerCase(),
    }
  }

  return {
    createAuthorizationUrl,
    exchangeCodeForIdentity,
  }
}
