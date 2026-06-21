const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const ACCESS_KEY = "truvade_access";
const REFRESH_KEY = "truvade_refresh";

// ── Token storage ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ── Error types ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Extract a human-readable string from an ApiError or unknown error. */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.details) {
      const details = err.details as Record<string, string[] | string>;
      for (const key of Object.keys(details)) {
        const val = details[key];
        const text = Array.isArray(val) ? val[0] : val;
        if (text) {
          return key === "non_field_errors" ? text : `${key}: ${text}`;
        }
      }
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

// ── Token refresh ────────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE_URL}/v1/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const json = await res.json();
    const newAccess: string = json.access;
    localStorage.setItem(ACCESS_KEY, newAccess);
    return newAccess;
  } catch {
    return null;
  }
}

function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh calls
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Core request ─────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;
  // Only set Content-Type when we actually have a JSON body. Setting it on
  // GETs (or any bodyless request) turns the call into a non-simple CORS
  // request and forces a preflight, which fails noisily when the server's
  // CORS config doesn't reply quickly to OPTIONS.
  const hasJsonBody = !!options.body && !isFormData;

  const headers: Record<string, string> = {
    ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, options, false);
    }
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  // Try to parse JSON; backend sometimes returns HTML (Django debug page, proxy
  // error page, etc.) on 500s. Don't let a raw "Unexpected token '<'" leak to
  // the UI.
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(genericMessageForStatus(res.status), res.status);
    }
    throw new ApiError("Unexpected server response. Please try again.", res.status);
  }

  if (!res.ok) {
    const err = (json as { error?: { message?: string; details?: Record<string, unknown> } })?.error ?? {};
    const message = err.message ?? genericMessageForStatus(res.status);
    throw new ApiError(message, res.status, err.details);
  }

  return (json as { data: T }).data;
}

function genericMessageForStatus(status: number): string {
  if (status === 401) return "Please log in to continue.";
  if (status === 403) return "Action not allowed.";
  if (status === 404) return "Not found.";
  if (status === 429) return "Too many attempts. Wait a moment and try again.";
  if (status >= 500) return "Something went wrong. Please try again.";
  return "Something went wrong. Please try again.";
}

// ── Public API ───────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};

// ── Typed API helpers ─────────────────────────────────────────────────────────
// These call specific endpoints and return typed data.
// Import ApiUser, ApiShortlet, etc. from api-types.ts

export * from "./api-types";
