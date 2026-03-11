import { apiDelete, apiGet, apiPost, apiPut } from './api-service'

export type AdminTaskStatus = 'todo' | 'in_progress' | 'completed' | 'done' | string
export type AdminTaskPriority = 'low' | 'medium' | 'high' | string

export type AdminTask = {
  id: string
  title: string
  description: string
  status: AdminTaskStatus
  priority: AdminTaskPriority
  assigneeId: string
  assigneeName: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  tags: string[]
  category: string
  isLocked: boolean
}

export type AdminTaskLockState = {
  id: string
  isLocked: boolean
  updatedAt: string
}

export type CreateAdminTaskPayload = {
  title: string
  description?: string
  status?: AdminTaskStatus
  priority?: AdminTaskPriority
  assigneeId?: string
  assigneeName?: string
  dueDate?: string | null
  tags?: string[]
  category?: string
}

export type UpdateAdminTaskPayload = Partial<CreateAdminTaskPayload>

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

function toOptionalBoolean(value: unknown) {
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

  return null
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => toString(item))
    .filter(Boolean)
}

function normalizeTask(task: unknown, index: number): AdminTask | null {
  const source = toObject(task)
  if (!source) {
    return null
  }

  const id = toString(source.id) || toString(source._id)
  if (!id) {
    return null
  }

  const title = toString(source.title) || `Task ${index + 1}`
  const description = toString(source.description)
  const status = (toString(source.status) || 'todo') as AdminTaskStatus
  const priority = (toString(source.priority) || 'medium') as AdminTaskPriority
  const assigneeId = toString(source.assigneeId)
  const assigneeName = toString(source.assigneeName)
  const dueDateRaw = toString(source.dueDate)
  const dueDate = dueDateRaw ? dueDateRaw : null
  const createdAt = toString(source.createdAt)
  const updatedAt = toString(source.updatedAt)
  const completedAtRaw = toString(source.completedAt)
  const completedAt = completedAtRaw ? completedAtRaw : null
  const tags = toStringArray(source.tags)
  const category = toString(source.category)
  const isLocked = toBoolean(source.isLocked)

  return {
    id,
    title,
    description,
    status,
    priority,
    assigneeId,
    assigneeName,
    dueDate,
    createdAt,
    updatedAt,
    completedAt,
    tags,
    category,
    isLocked,
  }
}

function normalizeTaskLockState(details: unknown): AdminTaskLockState | null {
  const source = toObject(details)
  if (!source) {
    return null
  }

  const id = toString(source.id) || toString(source._id)
  if (!id) {
    return null
  }

  const isLocked = toOptionalBoolean(source.isLocked)
  if (isLocked === null) {
    return null
  }

  const updatedAt = toString(source.updatedAt)

  return {
    id,
    isLocked,
    updatedAt,
  }
}

function extractTaskList(details: unknown) {
  if (Array.isArray(details)) {
    return details
  }

  const envelope = toObject(details)
  if (!envelope) {
    return []
  }

  if (Array.isArray(envelope.data)) {
    return envelope.data
  }

  return []
}

export async function getAdminTasks() {
  const details = await apiGet<unknown>('/api/admin/tasks')
  const rawTasks = extractTaskList(details)

  return rawTasks
    .map((task, index) => normalizeTask(task, index))
    .filter((task): task is AdminTask => Boolean(task))
}

export async function createAdminTask(payload: CreateAdminTaskPayload) {
  const details = await apiPost<unknown, CreateAdminTaskPayload>('/api/admin/tasks', payload)
  return normalizeTask(details, 0)
}

export async function updateAdminTask(taskId: string, payload: UpdateAdminTaskPayload) {
  const details = await apiPut<unknown, UpdateAdminTaskPayload>(
    `/api/admin/tasks/${encodeURIComponent(taskId)}`,
    payload,
  )
  return normalizeTask(details, 0)
}

export async function deleteAdminTask(taskId: string) {
  await apiDelete<unknown>(`/api/admin/tasks/${encodeURIComponent(taskId)}`)
}

export async function lockAdminTask(taskId: string) {
  const details = await apiPost<unknown>(`/api/admin/tasks/${encodeURIComponent(taskId)}/lock`)
  return normalizeTaskLockState(details)
}

export async function unlockAdminTask(taskId: string) {
  const details = await apiPost<unknown>(`/api/admin/tasks/${encodeURIComponent(taskId)}/unlock`)
  return normalizeTaskLockState(details)
}
