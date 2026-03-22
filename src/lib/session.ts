const LOCAL_SESSION_KEY = 'habeep-auth-session-local'
const TEMP_SESSION_KEY = 'habeep-auth-session-temp'
export const AUTH_SESSION_EVENT = 'habeep:auth-session-change'

type SessionStorageTarget = 'local' | 'session'

export type AuthSession = {
  accessToken: string
  refreshToken?: string
  sessionId?: string
  expiresAt?: string
  user?: unknown
}

function emitAuthSessionChange(session: AuthSession | null) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_EVENT, {
      detail: {
        hasSession: Boolean(session?.accessToken),
      },
    }),
  )
}

function parseSession(value: string | null): AuthSession | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as Partial<AuthSession>
    if (!parsed?.accessToken || typeof parsed.accessToken !== 'string') {
      return null
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined,
      sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : undefined,
      expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : undefined,
      user: parsed.user,
    }
  } catch {
    return null
  }
}

function getStoredSessionEntry(): { session: AuthSession; target: SessionStorageTarget } | null {
  if (typeof window === 'undefined') {
    return null
  }

  const localSession = parseSession(window.localStorage.getItem(LOCAL_SESSION_KEY))
  if (localSession) {
    return { session: localSession, target: 'local' }
  }

  const tempSession = parseSession(window.sessionStorage.getItem(TEMP_SESSION_KEY))
  if (tempSession) {
    return { session: tempSession, target: 'session' }
  }

  return null
}

function writeSession(session: AuthSession, target: SessionStorageTarget) {
  const serialized = JSON.stringify(session)
  window.localStorage.removeItem(LOCAL_SESSION_KEY)
  window.sessionStorage.removeItem(TEMP_SESSION_KEY)

  if (target === 'local') {
    window.localStorage.setItem(LOCAL_SESSION_KEY, serialized)
    emitAuthSessionChange(session)
    return
  }

  window.sessionStorage.setItem(TEMP_SESSION_KEY, serialized)
  emitAuthSessionChange(session)
}

export function saveSession(session: AuthSession, rememberMe: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  writeSession(session, rememberMe ? 'local' : 'session')
}

export function getSession(): AuthSession | null {
  return getStoredSessionEntry()?.session ?? null
}

export function getAccessToken() {
  return getSession()?.accessToken ?? null
}

export function getRefreshToken() {
  return getSession()?.refreshToken ?? null
}

export function updateSessionTokens(tokens: {
  accessToken: string
  refreshToken?: string
  sessionId?: string
}) {
  if (typeof window === 'undefined') {
    return
  }

  const storedSessionEntry = getStoredSessionEntry()
  if (!storedSessionEntry) {
    return
  }

  const nextSession: AuthSession = {
    ...storedSessionEntry.session,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? storedSessionEntry.session.refreshToken,
    sessionId: tokens.sessionId ?? storedSessionEntry.session.sessionId,
  }

  writeSession(nextSession, storedSessionEntry.target)
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(LOCAL_SESSION_KEY)
  window.sessionStorage.removeItem(TEMP_SESSION_KEY)
  emitAuthSessionChange(null)
}
