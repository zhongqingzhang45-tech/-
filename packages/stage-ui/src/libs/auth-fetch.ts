import { getPosthogIdentitySnapshot } from '../stores/analytics/posthog'
import { useAuthStore } from '../stores/auth'
import { getAuthToken } from './auth'
import { SERVER_URL } from './server'

/**
 * Fetch wrapper that transparently refreshes the OIDC access token on 401
 * and retries the original request once. Refresh is single-flight across
 * concurrent callers via the auth store's `refreshTokenNow()` action.
 *
 * Why not rely on the proactive 80%-lifetime scheduler alone: clock skew,
 * suspended tabs, and the post-reload race (fetchSession firing before
 * restoreRefreshSchedule resolves) can all leak an expired Bearer through.
 * The reactive 401 path is the safety net.
 *
 * When refresh cannot succeed — missing state (refreshToken/oidcClientId),
 * refresh endpoint errors, or a retried request that still returns 401 —
 * clear local auth state and flip `needsLogin` so the user is prompted to
 * sign in immediately, instead of letting the dead session linger until the
 * next fetchSession call on the home page.
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  // NOTICE: native `fetch` has no default timeout. On weak/congested mobile
  // networks (especially domestic 4G behind carrier-grade NAT) an un-timed-out
  // request can hang indefinitely until the OS tears the socket down — anywhere
  // from 30s to several minutes. Pin a single-flight 30s ceiling by default,
  // lower to 10s when we can detect a mobile/handheld UA, and let callers
  // override via their own signal when they know better.
  const existingSignal = init?.signal
  const defaultTimeoutMs = isHandheldUserAgent() ? 10_000 : 30_000
  const timeoutController = !existingSignal ? new AbortController() : undefined
  const timeoutSignal = timeoutController?.signal
  const combinedSignal = existingSignal ?? timeoutSignal

  const doFetch = (token: string | null): Promise<Response> => {
    const headers = new Headers(init?.headers)
    if (token)
      headers.set('Authorization', `Bearer ${token}`)
    const posthogIdentity = shouldAttachPosthogIdentity(input) ? getPosthogIdentitySnapshot() : null
    if (posthogIdentity) {
      headers.set('x-posthog-distinct-id', posthogIdentity.distinctId)
      if (posthogIdentity.sessionId)
        headers.set('x-posthog-session-id', posthogIdentity.sessionId)
    }
    if (timeoutController && !existingSignal) {
      const timeoutId = setTimeout(
        () => timeoutController.abort(new DOMException('Network timeout', 'TimeoutError')),
        defaultTimeoutMs,
      )
      timeoutSignal?.addEventListener('abort', () => clearTimeout(timeoutId), { once: true })
    }
    return fetch(input, { ...init, headers, credentials: 'omit', signal: combinedSignal })
  }

  const response = await doFetch(getAuthToken())
  if (response.status !== 401)
    return response

  // Don't recurse on the token endpoint itself
  const url = typeof input === 'string'
    ? input
    : input instanceof URL ? input.toString() : input.url
  if (url.includes('/oauth2/token'))
    return response

  const authStore = useAuthStore()
  const newToken = await authStore.refreshTokenNow()
  if (!newToken) {
    promptReLogin(authStore)
    return response
  }

  const retried = await doFetch(newToken)
  if (retried.status === 401)
    promptReLogin(authStore)
  return retried
}

function isHandheldUserAgent(): boolean {
  if (typeof navigator === 'undefined')
    return false
  const ua = navigator.userAgent ?? ''
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|XiaoMi|MIUI|OPPO|vivo/i.test(ua)
}

function shouldAttachPosthogIdentity(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL ? input.toString() : input.url

  return new URL(url, SERVER_URL).origin === new URL(SERVER_URL).origin
}

function promptReLogin(authStore: ReturnType<typeof useAuthStore>): void {
  authStore.clearAllAuthState()
  authStore.needsLogin = true
}
