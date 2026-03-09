import type { AxiosRequestConfig } from 'axios'

import { httpDelete, httpGet, httpPatch, httpPost, httpPut } from '../lib/http-client'

export type ApiEnvelope<TDetails> = {
  statusCode: number
  message: string
  code: string
  details: TDetails
  timestamp: string
  requestId: string
}

export type ApiResponseMeta = {
  statusCode: number
  message: string
  code: string
  path: string
  success: boolean
  version: string
  timestamp: string
  requestId: string
}

type LooseObject = Record<string, unknown>

function toObject(value: unknown): LooseObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as LooseObject
}

export function extractApiDetails<TDetails>(payload: unknown): TDetails {
  const envelope = toObject(payload)

  if (!envelope) {
    throw new Error('Unexpected API response format: empty payload.')
  }

  // Standard API envelope: { details: ... }
  if (Object.prototype.hasOwnProperty.call(envelope, 'details')) {
    return envelope.details as TDetails
  }

  // Common API envelope: { data: ... } (+ meta fields like path/message/success/statusCode)
  if (Object.prototype.hasOwnProperty.call(envelope, 'data')) {
    const dataPayload = toObject(envelope.data)
    if (!dataPayload) {
      return envelope.data as TDetails
    }

    // Preserve paginated wrappers like { data: [...], meta: {...} }.
    if (Object.prototype.hasOwnProperty.call(dataPayload, 'meta')) {
      return dataPayload as TDetails
    }

    if (Object.prototype.hasOwnProperty.call(dataPayload, 'details')) {
      return dataPayload.details as TDetails
    }

    if (Object.prototype.hasOwnProperty.call(dataPayload, 'result')) {
      return dataPayload.result as TDetails
    }

    if (Object.prototype.hasOwnProperty.call(dataPayload, 'data')) {
      return dataPayload.data as TDetails
    }

    return dataPayload as TDetails
  }

  // Legacy envelope: { result: ... }
  if (Object.prototype.hasOwnProperty.call(envelope, 'result')) {
    const resultPayload = toObject(envelope.result)
    if (!resultPayload) {
      return envelope.result as TDetails
    }

    if (Object.prototype.hasOwnProperty.call(resultPayload, 'meta')) {
      return resultPayload as TDetails
    }

    if (Object.prototype.hasOwnProperty.call(resultPayload, 'details')) {
      return resultPayload.details as TDetails
    }

    if (Object.prototype.hasOwnProperty.call(resultPayload, 'data')) {
      return resultPayload.data as TDetails
    }

    if (Object.prototype.hasOwnProperty.call(resultPayload, 'result')) {
      return resultPayload.result as TDetails
    }

    return resultPayload as TDetails
  }

  return envelope as TDetails
}

export function extractApiResponseMeta(payload: unknown): ApiResponseMeta {
  const envelope = toObject(payload)

  return {
    statusCode: typeof envelope?.statusCode === 'number' ? envelope.statusCode : 0,
    message: typeof envelope?.message === 'string' ? envelope.message : '',
    code: typeof envelope?.code === 'string' ? envelope.code : '',
    path: typeof envelope?.path === 'string' ? envelope.path : '',
    success: typeof envelope?.success === 'boolean' ? envelope.success : false,
    version: typeof envelope?.version === 'string' ? envelope.version : '',
    timestamp: typeof envelope?.timestamp === 'string' ? envelope.timestamp : '',
    requestId: typeof envelope?.requestId === 'string' ? envelope.requestId : '',
  }
}

export async function apiGet<TDetails>(url: string, config?: AxiosRequestConfig) {
  const payload = await httpGet<unknown>(url, config)
  return extractApiDetails<TDetails>(payload)
}

export async function apiGetWithMeta<TDetails>(url: string, config?: AxiosRequestConfig) {
  const payload = await httpGet<unknown>(url, config)

  return {
    details: extractApiDetails<TDetails>(payload),
    meta: extractApiResponseMeta(payload),
  }
}

export async function apiPost<TDetails, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  config?: AxiosRequestConfig<TPayload>,
) {
  const responsePayload = await httpPost<unknown, TPayload>(url, payload, config)
  return extractApiDetails<TDetails>(responsePayload)
}

export async function apiPut<TDetails, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  config?: AxiosRequestConfig<TPayload>,
) {
  const responsePayload = await httpPut<unknown, TPayload>(url, payload, config)
  return extractApiDetails<TDetails>(responsePayload)
}

export async function apiPatch<TDetails, TPayload = unknown>(
  url: string,
  payload?: TPayload,
  config?: AxiosRequestConfig<TPayload>,
) {
  const responsePayload = await httpPatch<unknown, TPayload>(url, payload, config)
  return extractApiDetails<TDetails>(responsePayload)
}

export async function apiDelete<TDetails>(url: string, config?: AxiosRequestConfig) {
  const payload = await httpDelete<unknown>(url, config)
  return extractApiDetails<TDetails>(payload)
}
