import { apiDelete, apiGet, apiPost, apiPut } from './api-service'

export type AdminCalendarEvent = {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  allDay: boolean
  type: string
  color: string
  attendees: string[]
  location: string
  taskId: string
  createdAt: string
  updatedAt: string
}

export type UpdateAdminCalendarEventPayload = Partial<{
  title: string
  description: string
  startDate: string
  endDate: string
  allDay: boolean
  type: string
  color: string
  attendees: string[]
  location: string
  taskId: string
}>

export type CreateAdminCalendarEventPayload = {
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay?: boolean
  type?: string
  color?: string
  attendees?: string[]
  location?: string
  taskId?: string
}

export type GetAdminCalendarEventsParams = {
  type?: string
  startDate: string
  endDate: string
  page?: number
  limit?: number
}

type LooseObject = Record<string, unknown>

function toObject(value: unknown): LooseObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as LooseObject
}

function toString(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase()
    if (normalizedValue === 'true') {
      return true
    }
    if (normalizedValue === 'false') {
      return false
    }
  }

  return false
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => toString(item))
    .filter(Boolean)
}

function normalizeCalendarEvent(item: unknown): AdminCalendarEvent | null {
  const source = toObject(item)
  if (!source) {
    return null
  }

  const id = toString(source.id) || toString(source._id)
  if (!id) {
    return null
  }

  return {
    id,
    title: toString(source.title) || 'Untitled event',
    description: toString(source.description),
    startDate: toString(source.startDate),
    endDate: toString(source.endDate),
    allDay: toBoolean(source.allDay),
    type: toString(source.type) || 'event',
    color: toString(source.color) || '#3b82f6',
    attendees: toStringArray(source.attendees),
    location: toString(source.location),
    taskId: toString(source.taskId),
    createdAt: toString(source.createdAt),
    updatedAt: toString(source.updatedAt),
  }
}

export async function getAdminCalendarEvents(params: GetAdminCalendarEventsParams) {
  const queryParams = new URLSearchParams()

  if (params.type) {
    queryParams.set('type', params.type)
  }

  queryParams.set('startDate', params.startDate)
  queryParams.set('endDate', params.endDate)

  if (typeof params.page === 'number') {
    queryParams.set('page', String(params.page))
  }

  if (typeof params.limit === 'number') {
    queryParams.set('limit', String(params.limit))
  }

  const details = await apiGet<unknown>(`/api/admin/calendar/events?${queryParams.toString()}`)
  const rawEvents = Array.isArray(details) ? details : []

  return rawEvents
    .map((event) => normalizeCalendarEvent(event))
    .filter((event): event is AdminCalendarEvent => Boolean(event))
}

export async function getAdminCalendarEvent(eventId: string) {
  const details = await apiGet<unknown>(`/api/admin/calendar/events/${encodeURIComponent(eventId)}`)
  return normalizeCalendarEvent(details)
}

export async function createAdminCalendarEvent(payload: CreateAdminCalendarEventPayload) {
  const details = await apiPost<unknown, CreateAdminCalendarEventPayload>('/api/admin/calendar/events', payload)
  return normalizeCalendarEvent(details)
}

export async function updateAdminCalendarEvent(eventId: string, payload: UpdateAdminCalendarEventPayload) {
  const details = await apiPut<unknown, UpdateAdminCalendarEventPayload>(
    `/api/admin/calendar/events/${encodeURIComponent(eventId)}`,
    payload,
  )
  return normalizeCalendarEvent(details)
}

export async function deleteAdminCalendarEvent(eventId: string) {
  await apiDelete<unknown>(`/api/admin/calendar/events/${encodeURIComponent(eventId)}`)
}
