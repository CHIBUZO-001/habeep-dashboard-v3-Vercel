import type { AuthSession } from '../lib/session'
import { httpGet, httpPost } from '../lib/http-client'
import { apiGet } from './api-service'

type LoginPayload = {
  email: string
  password: string
}

export type AuthSessionLog = {
  id: string
  device: string
  ip: string
  active: boolean
  current: boolean
  createdAt: string
  updatedAt: string
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

function getText(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedValue = value.trim()
  return normalizedValue || undefined
}

function getBoolean(source: LooseObject | null, keys: string[]) {
  if (!source) {
    return false
  }

  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'boolean') {
      return value
    }
    if (typeof value === 'string') {
      if (value === 'true') {
        return true
      }
      if (value === 'false') {
        return false
      }
    }
    if (typeof value === 'number') {
      if (value === 1) {
        return true
      }
      if (value === 0) {
        return false
      }
    }
  }

  return false
}

function extractSessionsPayload(rawDetails: unknown) {
  if (Array.isArray(rawDetails)) {
    return rawDetails
  }

  const source = toObject(rawDetails)
  if (!source) {
    return []
  }

  if (Array.isArray(source.sessions)) {
    return source.sessions
  }

  const dataNode = toObject(source.data)
  if (Array.isArray(dataNode?.sessions)) {
    return dataNode.sessions
  }

  return []
}

function normalizeSessionLogItem(item: unknown): AuthSessionLog | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const id = getString(source, ['id', 'sessionId', 'session_id'])
  if (!id) {
    return null
  }

  return {
    id,
    device: getString(source, ['device']) ?? 'web',
    ip: getString(source, ['ip', 'ipAddress']) ?? 'Unknown',
    active: getBoolean(source, ['active']),
    current: getBoolean(source, ['current', 'isCurrent']),
    createdAt: getString(source, ['createdAt', 'created_at']) ?? '',
    updatedAt: getString(source, ['updatedAt', 'updated_at']) ?? '',
  }
}

function normalizeSessionLogs(rawDetails: unknown): AuthSessionLog[] {
  const sessions = extractSessionsPayload(rawDetails)
  if (!Array.isArray(sessions)) {
    return []
  }

  return sessions
    .map((item) => normalizeSessionLogItem(item))
    .filter((item): item is AuthSessionLog => Boolean(item))
}

function isGenericSuccessMessage(message: string) {
  const normalizedMessage = message.trim().toLowerCase()
  return (
    normalizedMessage === 'ok' ||
    normalizedMessage === 'request successful' ||
    normalizedMessage === 'request succeeded' ||
    normalizedMessage === 'success'
  )
}

function extractPayloadValidationMessage(source: LooseObject | null) {
  const errors = source?.errors
  if (!Array.isArray(errors)) {
    return undefined
  }

  for (const item of errors) {
    const errorSource = toObject(item)
    const message = getString(errorSource, ['message', 'error'])
    if (message) {
      return message
    }
  }

  return undefined
}

function extractLoginErrorMessage(response: unknown) {
  const rootPayload = toObject(response)
  if (!rootPayload) {
    return undefined
  }

  const directPayloadMessage =
    getText(rootPayload.data) ??
    getText(rootPayload.details) ??
    getString(rootPayload, ['error']) ??
    extractPayloadValidationMessage(rootPayload)
  if (directPayloadMessage) {
    return directPayloadMessage
  }

  const envelope = toObject(rootPayload.data) ?? toObject(rootPayload.result) ?? rootPayload
  const details = toObject(envelope.details) ?? toObject(envelope.data)

  const nestedPayloadMessage =
    getText(envelope.data) ??
    getText(envelope.details) ??
    getString(details, ['error']) ??
    getString(envelope, ['error']) ??
    extractPayloadValidationMessage(details) ??
    extractPayloadValidationMessage(envelope)
  if (nestedPayloadMessage) {
    return nestedPayloadMessage
  }

  const fallbackMessage =
    getString(details, ['message']) ?? getString(envelope, ['message']) ?? getString(rootPayload, ['message'])

  if (fallbackMessage && !isGenericSuccessMessage(fallbackMessage)) {
    return fallbackMessage
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
    throw new Error(extractLoginErrorMessage(response) ?? 'Login succeeded but no access token was returned by the API.')
  }

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresAt,
    user,
  }
}

function normalizeProfile(response: unknown) {
  const rootPayload = toObject(response)
  const envelope = toObject(rootPayload?.data) ?? toObject(rootPayload?.result) ?? rootPayload
  const details = toObject(envelope?.details) ?? toObject(envelope?.data)
  return details ?? envelope
}

function decodeJwtPayload(token: string): LooseObject | null {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  const payload = parts[1]
  if (!payload) {
    return null
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    return toObject(JSON.parse(decoded))
  } catch {
    return null
  }
}

function getRoleFromAccessToken(token: string) {
  const claims = decodeJwtPayload(token)
  const roles = claims?.roles
  if (!Array.isArray(roles)) {
    return undefined
  }

  const firstRole = roles.find((role) => typeof role === 'string' && role.trim())
  return typeof firstRole === 'string' ? firstRole : undefined
}

function buildSessionUser(loginEmail: string, accessToken: string, profile: LooseObject | null) {
  const user: LooseObject = {}
  const email = loginEmail.trim()
  const tokenSubject =
    getString(decodeJwtPayload(accessToken), ['sub', 'userId', 'id']) ??
    getString(profile, ['id'])
  const tokenRole = getRoleFromAccessToken(accessToken)

  if (profile) {
    Object.assign(user, profile)
  }
  if (!getString(profile, ['id']) && tokenSubject) {
    user.id = tokenSubject
  }
  if (!getString(profile, ['email']) && email) {
    user.email = email
  }
  if (!getString(profile, ['role']) && tokenRole) {
    user.role = tokenRole
  }

  return Object.keys(user).length > 0 ? user : undefined
}

function getSuccessFlag(response: unknown) {
  const envelope = toObject(response)
  if (typeof envelope?.success === 'boolean') {
    return envelope.success
  }

  const details = toObject(envelope?.details) ?? toObject(envelope?.data)
  if (typeof details?.success === 'boolean') {
    return details.success
  }

  return details?.success
}

export async function login(payload: LoginPayload) {
  const response = await httpPost<unknown, LoginPayload>('/api/auth/login', payload)
  const session = normalizeLoginSession(response)

  try {
    const profileResponse = await httpGet<unknown>('/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })
    const profile = normalizeProfile(profileResponse)
    return {
      ...session,
      user: buildSessionUser(payload.email, session.accessToken, profile),
    }
  } catch {
    return {
      ...session,
      user: buildSessionUser(payload.email, session.accessToken, toObject(session.user)),
    }
  }
}

export async function listAuthSessions() {
  const rawDetails = await apiGet<unknown>('/api/auth/sessions/list')
  return normalizeSessionLogs(rawDetails)
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
