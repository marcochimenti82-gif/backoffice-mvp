import type {
  UserPublic,
  ReservationPublic,
  PatchReservationInput,
  ReservationStatus,
} from "@backoffice/shared";

/**
 * IMPORTANT:
 * - NEXT_PUBLIC_API_BASE_URL must be set in Render (backoffice-web)
 *   e.g. https://backoffice-api-qw53.onrender.com
 */
function requireApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!raw) {
    // Fail fast with a clear error (prevents "undefined/auth/..." calls on the WEB origin).
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Set it in Render (backoffice-web) Environment to your API URL, e.g. https://backoffice-api-qw53.onrender.com"
    );
  }

  // Trim whitespace + remove trailing slashes
  return raw.trim().replace(/\/+$/, "");
}

function normalizePath(path: string): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

type ApiError = { error: string; details?: unknown };

function getCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("bo_csrf");
}

function setCsrfToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("bo_csrf", token);
}

async function tryRefresh(): Promise<UserPublic | null> {
  const API_BASE = requireApiBase();

  const resp = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    mode: "cors",
  });

  if (!resp.ok) return null;

  const json = (await resp.json().catch(() => null)) as
    | { user?: UserPublic; csrfToken?: string }
    | null;

  if (json?.csrfToken) setCsrfToken(json.csrfToken);
  return json?.user ?? null;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<T> {
  const API_BASE = requireApiBase();
  const url = `${API_BASE}${normalizePath(path)}`;

  const method = (init.method ?? "GET").toUpperCase();
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Build headers
  const headers = new Headers(init.headers);

  // Only force JSON content-type if we're likely sending JSON
  // (prevents breaking FormData / file uploads in future)
  if (!headers.has("content-type") && init.body && typeof init.body === "string") {
    headers.set("content-type", "application/json");
  }

  // CSRF only for unsafe methods
  if (unsafe) {
    const csrf = getCsrfToken();
    if (csrf) headers.set("x-csrf-token", csrf);
  }

  const resp = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
    mode: "cors",
  });

  // Auto refresh on 401 (once)
  if (resp.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) return apiFetch<T>(path, init, false);
  }

  if (!resp.ok) {
    const err = (await resp.json().catch(() => null)) as ApiError | null;
    throw new Error(err?.error ?? `HTTP_${resp.status}`);
  }

  // Some endpoints may return empty body (204) in future
  if (resp.status === 204) return undefined as unknown as T;

  return (await resp.json()) as Promise<T>;
}

export async function login(email: string, password: string) {
  const resp = await apiFetch<{ user: UserPublic; csrfToken: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false
  );

  if (resp.csrfToken) setCsrfToken(resp.csrfToken);
  return resp.user;
}

export async function logout() {
  await apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({}) }, false);
  if (typeof window !== "undefined") sessionStorage.removeItem("bo_csrf");
}

export async function me() {
  const resp = await apiFetch<{ user: UserPublic }>("/auth/me", {}, true);
  return resp.user;
}

export type ReservationFilters = {
  from?: string;
  to?: string;
  status?: ReservationStatus;
  q?: string;
};

export async function listReservations(filters: ReservationFilters) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);

  const resp = await apiFetch<{ data: ReservationPublic[] }>(
    `/reservations?${params.toString()}`
  );
  return resp.data;
}

export async function patchReservation(id: string, input: PatchReservationInput) {
  const resp = await apiFetch<{ data: ReservationPublic }>(`/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return resp.data;
}
