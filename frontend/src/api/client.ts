const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  body: { error?: string } | null;

  constructor(status: number, body: { error?: string } | null) {
    super(body?.error ?? `Erreur API ${status}`);
    this.status = status;
    this.body = body;
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function rawRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Endpoints where a 401 is the real answer (bad credentials / no session),
// not an expired access token. Retrying these through /refresh would mask the
// real error with a misleading "Aucune session à renouveler".
const NO_REFRESH_RETRY = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
]);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !NO_REFRESH_RETRY.has(path)) {
      try {
        const { accessToken: newToken } = await rawRequest<{ accessToken: string }>("/api/auth/refresh", {
          method: "POST",
        });
        setAccessToken(newToken);
        return await rawRequest<T>(path, options);
      } catch {
        // Refresh failed: surface the original 401, not the refresh error.
        throw err;
      }
    }
    throw err;
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
