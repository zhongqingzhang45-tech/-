function resolveServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL)
    return import.meta.env.VITE_SERVER_URL

  if (import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL

  if (typeof window !== 'undefined' && window.location?.origin)
    return window.location.origin

  return 'https://api.airi.build'
}

export const SERVER_URL = resolveServerUrl()

export const SERVER_REQUEST_TIMEOUT_MS = 30_000
