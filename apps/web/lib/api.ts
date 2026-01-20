import type {
  UserPublic,
  ReservationPublic,
  PatchReservationInput,
  ReservationStatus,
} from "@backoffice/shared";

/**
 * Base URL API (deve essere presente in Render: NEXT_PUBLIC_API_BASE_URL)
 * Esempio: https://backoffice-api-qw53.onrender.com
 */
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

function normalizeApiBase(v?: string) {
  const s = (v ?? "").trim();
  if (!s) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is missing. Set it in Render (backoffice-web) and redeploy."
    );
  }
  // rimuove eventuale slash finale
  return s.replace(/\/+$/, "");
}

const API_BASE = normalizeApiBase(RAW_API_BASE);

type ApiError = { error: string; details?: unknown };

function joinUrl(base: string, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function getCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("bo_csrf");
}

function setCsrfToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("bo_csrf", token);
}

function clearCsrfToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("bo_csrf");
}

/**
 * Refresh token (usa cookie bo_refresh) -> ottiene nuovo access token e (opz) nuovo csrfToken.
 * IMPORTANTE: inviamo anche x-csrf-token se disponibile.
 */
async function tryRefresh(): Promise<UserPublic | null> {
  const csrf = getCsrfToken();

  const headers = new Headers();
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  if (csrf) headers.set("x-csrf-token", csrf);

  const resp = await fetch(joinUrl(API_BASE, "/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers,
    cache: "no-store",
    body: JSON.stringify({}),
  });

  if (!resp.ok) return null;

  const json = (await resp.json().catch(() => null)) as
    | { user?: UserPublic; csrfToken?: string }
    | null;

  if (json?.csrfToken) setCsrfToken(json.csrfToken);

  return json?.user ?? null;
}

function shouldAttemptRefreshOn401(path: string) {
  // mai provare refresh su queste (evita loop)
  if (path === "/auth/refresh") return false;
  if (path === "/auth/login") return false;
  if (path === "/auth/logout") return false;

  // su /auth/me sì (access scaduto)
  return true;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const hasBody = init.body != null;

  // Consideriamo "unsafe" i metodi che modificano stato
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");

  // Metti content-type JSON solo se serve (POST/PUT/PATCH/DELETE o body presente)
  if ((unsafe || hasBody) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  // CSRF: lo inviamo quando presente
  const csrf = getCsrfToken();
  if (csrf && !headers.has("x-csrf-token")) {
    headers.set("x-csrf-token", csrf);
  }

  const url = joinUrl(API_BASE, path);

  const resp = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  // Se non autenticato, proviamo refresh UNA volta (anche su /auth/me, ma non su login/logout/refresh)
  if (resp.status === 401 && retry && shouldAttemptRefreshOn401(path)) {
    const ok = await tryRefresh();
    if (ok) return apiFetch<T>(path, init, false);
  }

  if (!resp.ok) {
    const err = (await resp.json().catch(() => null)) as ApiError | null;
    throw new Error(err?.error ?? `HTTP_${resp.status}`);
  }

  // Alcune route potrebbero rispondere senza body JSON
  const data = (await resp.json().catch(() => null)) as T | null;
  return data as T;
}

export async function login(email: string, password: string) {
  const resp = await apiFetch<{ user: UserPublic; csrfToken?: string }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false
  );

  // Se login non torna csrfToken, lo otteniamo subito con refresh (così le PATCH/POST funzionano sempre)
  if (resp.csrfToken) {
    setCsrfToken(resp.csrfToken);
  } else {
    await tryRefresh();
  }

  return resp.user;
}

export async function logout() {
  await apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({}) }, false);
  clearCsrfToken();
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
  if (filters.status) params.set("status", String(filters.status));
  if (filters.q) params.set("q", filters.q);

  const qs = params.toString();
  const resp = await apiFetch<{ data: ReservationPublic[] }>(
    `/reservations${qs ? `?${qs}` : ""}`
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
