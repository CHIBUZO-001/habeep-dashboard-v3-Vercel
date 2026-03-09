import { getApiErrorMessage } from '../lib/http-client'

type LooseObject = Record<string, unknown>

export type AutomationPlan = {
  title: string
  summary: string
  steps: string[]
  safeguards: string[]
  successSignals: string[]
}

export type AutomationPromptPayload = {
  workspace: string
  route: string
  prompt: string
}

type GeminiTextPart = {
  text?: string
}

type GeminiCandidate = {
  content?: {
    parts?: GeminiTextPart[]
  }
}

type GeminiResponse = {
  candidates?: GeminiCandidate[]
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'

function toObject(value: unknown): LooseObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as LooseObject
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function stripCodeFence(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function parsePlanText(rawText: string): AutomationPlan {
  const cleanedText = stripCodeFence(rawText)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleanedText)
  } catch {
    return {
      title: 'Automation Plan',
      summary: cleanedText || 'Unable to parse AI response as JSON.',
      steps: [],
      safeguards: [],
      successSignals: [],
    }
  }

  const source = toObject(parsed)
  if (!source) {
    return {
      title: 'Automation Plan',
      summary: cleanedText,
      steps: [],
      safeguards: [],
      successSignals: [],
    }
  }

  const title = typeof source.title === 'string' ? source.title.trim() : 'Automation Plan'
  const summary = typeof source.summary === 'string' ? source.summary.trim() : ''

  return {
    title: title || 'Automation Plan',
    summary,
    steps: toStringArray(source.steps),
    safeguards: toStringArray(source.safeguards),
    successSignals: toStringArray(source.successSignals),
  }
}

function extractModelText(response: GeminiResponse) {
  const candidate = response.candidates?.[0]
  const parts = candidate?.content?.parts
  if (!Array.isArray(parts)) {
    return ''
  }

  return parts
    .map((part) => part?.text ?? '')
    .join('\n')
    .trim()
}

function buildPrompt({ workspace, route, prompt }: AutomationPromptPayload) {
  return [
    'You are an operations automation assistant for an admin dashboard.',
    'Create practical automations with clear, implementable steps.',
    `Workspace: ${workspace}`,
    `Route: ${route}`,
    `User request: ${prompt}`,
    'Return strict JSON with this exact shape:',
    '{"title":"string","summary":"string","steps":["string"],"safeguards":["string"],"successSignals":["string"]}',
    'Keep each list concise with max 5 items.',
  ].join('\n')
}

export async function generateAutomationPlan(payload: AutomationPromptPayload) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Missing VITE_GOOGLE_API_KEY for AI automation.')
  }

  const rawModel = import.meta.env.VITE_AI_AUTOMATION_MODEL
  const model = typeof rawModel === 'string' && rawModel.trim() ? rawModel.trim() : DEFAULT_GEMINI_MODEL

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: buildPrompt(payload) }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  }

  const response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const rawError = await response.text().catch(() => '')
    const message = rawError || `AI request failed with status ${response.status}`
    throw new Error(message)
  }

  let responsePayload: GeminiResponse
  try {
    responsePayload = (await response.json()) as GeminiResponse
  } catch {
    throw new Error('Failed to parse AI response payload.')
  }

  const modelText = extractModelText(responsePayload)
  if (!modelText) {
    throw new Error('AI returned an empty response.')
  }

  try {
    return parsePlanText(modelText)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to generate automation plan.'))
  }
}
