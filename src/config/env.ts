function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL
if (!rawApiBaseUrl || !rawApiBaseUrl.trim()) {
  throw new Error('Missing VITE_API_BASE_URL. Set it in your .env file.')
}

export const API_BASE_URL = normalizeBaseUrl(rawApiBaseUrl.trim())
export const ENABLE_NGROK_BYPASS =
  import.meta.env.VITE_ENABLE_NGROK_BYPASS === 'true' || API_BASE_URL.includes('.ngrok-free.dev')
