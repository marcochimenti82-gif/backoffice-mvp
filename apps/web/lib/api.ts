import type { UserPublic, ReservationPublic, PatchReservationInput, ReservationStatus } from "@backoffice/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

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
  const resp = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include"
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  if (json?.csrfToken) setCsrfToken(json.csrfToken);
  return json?.user ?? null;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");

  if (unsafe) {
    const csrf = getCsrfToken();
    if (csrf) headers.set("x-csrf-token", csrf);
  }

  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include"
  });

  if (resp.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) return apiFetch<T>(path, init, false);
  }

  if (!resp.ok) {
    const err = (await resp.json().catch(() => null)) as ApiError | null;
    throw new Error(err?.error ?? `HTTP_${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  const resp = await apiFetch<{ user: UserPublic; csrfToken: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false
  );
  setCsrfToken(resp.csrfToken);
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

  const resp = await apiFetch<{ data: ReservationPublic[] }>(`/reservations?${params.toString()}`);
  return resp.data;
}

export async function patchReservation(id: string, input: PatchReservationInput) {
  const resp = await apiFetch<{ data: ReservationPublic }>(`/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return resp.data;
}
