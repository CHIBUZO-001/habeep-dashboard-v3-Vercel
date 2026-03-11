import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

import { API_BASE_URL, ENABLE_NGROK_BYPASS } from '../config/env'
import { clearSession, getAccessToken, getSession, updateSessionTokens } from './session'

const REFRESH_PATH = '/api/auth/refresh'
const NGROK_BYPASS_HEADER = 'ngrok-skip-browser-warning'

type LooseObject = Record<string, unknown>
type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean }

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(ENABLE_NGROK_BYPASS ? { [NGROK_BYPASS_HEADER]: 'true' } : {}),
  },
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(ENABLE_NGROK_BYPASS ? { [NGROK_BYPASS_HEADER]: 'true' } : {}),
  },
})

let refreshTokensPromise: Promise<{
  accessToken: string
  refreshToken?: string
  sessionId?: string
}> | null = null

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

function normalizeRefreshTokens(response: unknown) {
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
  const sessionId =
    getString(details, ['sessionId', 'session_id']) ?? getString(envelope, ['sessionId', 'session_id'])

  if (!accessToken) {
    throw new Error('Refresh token request succeeded but no access token was returned.')
  }

  return {
    accessToken,
    refreshToken,
    sessionId,
  }
}

function isAuthRequest(url: string) {
  return url.includes('/auth/login') || url.includes('/auth/logout') || url.includes('/auth/refresh')
}

async function requestTokenRefresh() {
  const existingSession = getSession()
  const refreshToken = existingSession?.refreshToken

  if (!refreshToken) {
    throw new Error('No refresh token found. Please sign in again.')
  }

  const payload: Record<string, string> = { refreshToken }
  if (existingSession?.sessionId) {
    payload.sessionId = existingSession.sessionId
  }

  const authHeaders = {
    Authorization: `Bearer ${refreshToken}`,
  }

  const response = await refreshClient.post(REFRESH_PATH, payload, {
    headers: authHeaders,
  })
  const nextTokens = normalizeRefreshTokens(response.data)
  updateSessionTokens(nextTokens)
  return nextTokens
}

function getRefreshTokensPromise() {
  if (!refreshTokensPromise) {
    refreshTokensPromise = requestTokenRefresh().finally(() => {
      refreshTokensPromise = null
    })
  }

  return refreshTokensPromise
}

httpClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  if (ENABLE_NGROK_BYPASS) {
    config.headers[NGROK_BYPASS_HEADER] = 'true'
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const statusCode = error.response?.status
    const originalRequest = error.config as RetriableRequestConfig | undefined
    const requestUrl = originalRequest?.url ?? ''
    const shouldSkipRefresh =
      statusCode !== 401 || !originalRequest || originalRequest._retry || isAuthRequest(requestUrl)

    if (shouldSkipRefresh) {
      if (statusCode === 401 && !requestUrl.includes('/auth/login')) {
        clearSession()
      }

      return Promise.reject(error)
    }

    try {
      const refreshedTokens = await getRefreshTokensPromise()
      const retryConfig: RetriableRequestConfig = {
        ...originalRequest,
        _retry: true,
        headers: {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${refreshedTokens.accessToken}`,
        },
      }

      return await httpClient.request(retryConfig)
    } catch (refreshError) {
      clearSession()
      return Promise.reject(refreshError)
    }
  },
)

export async function httpGet<TResponse>(url: string, config?: AxiosRequestConfig) {
  const response = await httpClient.get<TResponse>(url, config)
  return response.data
}

export async function httpPost<TResponse, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  config?: AxiosRequestConfig<TPayload>,
) {
  const response = await httpClient.post<TResponse>(url, payload, config)
  return response.data
}

export async function httpPut<TResponse, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  config?: AxiosRequestConfig<TPayload>,
) {
  const response = await httpClient.put<TResponse>(url, payload, config)
  return response.data
}

export async function httpPatch<TResponse, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  config?: AxiosRequestConfig<TPayload>,
) {
  const response = await httpClient.patch<TResponse>(url, payload, config)
  return response.data
}

export async function httpDelete<TResponse>(url: string, config?: AxiosRequestConfig) {
  const response = await httpClient.delete<TResponse>(url, config)
  return response.data
}

type ApiErrorPayload = {
  message?: string | string[]
  error?: string
  errors?: unknown
  details?: unknown
  data?: unknown
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed. Try again.') {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const payload = error.response?.data

    const messages: string[] = []

    const extractErrors = (errors: unknown) => {
      const extracted: string[] = []

      if (Array.isArray(errors)) {
        for (const entry of errors) {
          if (typeof entry === 'string' && entry.trim()) {
            extracted.push(entry.trim())
            continue
          }

          const node = toObject(entry)
          const messageValue = typeof node?.message === 'string' ? node.message.trim() : ''
          if (messageValue) {
            extracted.push(messageValue)
          }
        }

        return extracted
      }

      const errorMap = toObject(errors)
      if (!errorMap) {
        return extracted
      }

      for (const [field, value] of Object.entries(errorMap)) {
        if (typeof value === 'string' && value.trim()) {
          extracted.push(`${field}: ${value.trim()}`)
          continue
        }

        if (Array.isArray(value)) {
          const firstText = value.find((item) => typeof item === 'string' && item.trim())
          if (typeof firstText === 'string') {
            extracted.push(`${field}: ${firstText.trim()}`)
          }
          continue
        }

        const node = toObject(value)
        const messageValue = typeof node?.message === 'string' ? node.message.trim() : ''
        if (messageValue) {
          extracted.push(`${field}: ${messageValue}`)
        }
      }

      return extracted
    }

    const pushUnique = (items: string[]) => {
      for (const item of items) {
        if (item && !messages.includes(item)) {
          messages.push(item)
        }
      }
    }

    pushUnique(extractErrors(payload?.errors))

    if (Array.isArray(payload?.message)) {
      pushUnique(
        payload.message
          .filter((message): message is string => typeof message === 'string')
          .map((message) => message.trim())
          .filter(Boolean),
      )
    }

    pushUnique(extractErrors(payload?.details))
    pushUnique(extractErrors(payload?.data))

    if (messages.length > 0) {
      return messages.slice(0, 3).join(' · ')
    }

    const messageValue = typeof payload?.message === 'string' ? payload.message.trim() : ''
    return messageValue || payload?.error || fallback
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
