import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios"

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://api.myklola.cloud/webhook-test/gateway",
  headers: {
    "Content-Type": "application/json",
  },
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReqOptions = AxiosRequestConfig & {
  /** Clerk session ID — appended as x-session-id header */
  sessionId?: string
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function resolveHeaders(opts?: ReqOptions): Record<string, string> {
  const headers: Record<string, string> = {}

  if (opts?.sessionId) {
    headers["x-session-id"] = opts.sessionId
  }

  // Merge any additional headers passed in opts
  if (opts?.headers) {
    Object.assign(headers, opts.headers)
  }

  return headers
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export async function get<T = unknown>(
  url: string,
  opts?: ReqOptions
): Promise<AxiosResponse<T>> {
  return api.get<T>(url, { ...opts, headers: resolveHeaders(opts) })
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  opts?: ReqOptions
): Promise<AxiosResponse<T>> {
  return api.post<T>(url, data, { ...opts, headers: resolveHeaders(opts) })
}

export async function put<T = unknown>(
  url: string,
  data?: unknown,
  opts?: ReqOptions
): Promise<AxiosResponse<T>> {
  return api.put<T>(url, data, { ...opts, headers: resolveHeaders(opts) })
}

export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  opts?: ReqOptions
): Promise<AxiosResponse<T>> {
  return api.patch<T>(url, data, { ...opts, headers: resolveHeaders(opts) })
}

/**
 * DELETE helper — named `del` to avoid conflict with JS reserved word.
 */
export async function del<T = unknown>(
  url: string,
  opts?: ReqOptions
): Promise<AxiosResponse<T>> {
  return api.delete<T>(url, { ...opts, headers: resolveHeaders(opts) })
}
