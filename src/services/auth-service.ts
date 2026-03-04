import type { AuthSession } from '../lib/session'
import { httpPost } from '../lib/http-client'

type LoginPayload = {
  email: string
  password: string
}

type LooseObject = Record<string, unknown>

function toObject(value: unknown): LooseObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as LooseObject
}

function getString(source: LooseObject | null, keys: string[]) {
  if (!source) {
    return undefined
  }

  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return undefined
}

function normalizeLoginSession(response: unknown): AuthSession {
  const rootPayload = toObject(response)
  const envelope = toObject(rootPayload?.data) ?? toObject(rootPayload?.result) ?? rootPayload
  const details = toObject(envelope?.details) ?? toObject(envelope?.data)
  const tokens = toObject(details?.tokens) ?? toObject(envelope?.tokens)

  const accessToken =
    getString(details, ['accessToken', 'access_token']) ??
    getString(tokens, ['accessToken', 'access_token']) ??
    getString(envelope, ['accessToken', 'access_token', 'token'])
  const refreshToken =
    getString(details, ['refreshToken', 'refresh_token']) ??
    getString(tokens, ['refreshToken', 'refresh_token']) ??
    getString(envelope, ['refreshToken', 'refresh_token'])
  const sessionId = getString(details, ['sessionId', 'session_id']) ?? getString(envelope, ['sessionId', 'session_id'])
  const expiresAt =
    getString(details, ['expiresAt', 'expires_at']) ??
    getString(envelope, ['expiresAt', 'expires_at'])
  const user = toObject(details?.user) ?? toObject(envelope?.user) ?? details?.user ?? envelope?.user

  if (!accessToken) {
    throw new Error('Login succeeded but no access token was returned by the API.')
  }

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresAt,
    user,
  }
}

function getSuccessFlag(response: unknown) {
  const envelope = toObject(response)
  const details = toObject(envelope?.details) ?? toObject(envelope?.data)
  return details?.success
}

export async function login(payload: LoginPayload) {
  const response = await httpPost<unknown, LoginPayload>('/api/auth/login', payload)
  return normalizeLoginSession(response)
}

export async function revokeSession(sessionId: string) {
  const encodedSessionId = encodeURIComponent(sessionId)
  const response = await httpPost<unknown>(`/api/auth/sessions/${encodedSessionId}/revoke`)
  const success = getSuccessFlag(response)

  if (success === false) {
    throw new Error('Session revoke failed on server.')
  }

  return true
}

export async function logout(sessionId?: string) {
  if (sessionId) {
    try {
      await revokeSession(sessionId)
      return true
    } catch {
      // Fall back to normal logout when revoke endpoint is unavailable.
    }
  }

  const response = await httpPost<unknown>('/api/auth/logout')
  const success = getSuccessFlag(response)
  if (success === false) {
    throw new Error('Logout failed on server.')
  }

  return true
}
