let adminToken: string | null = null;

export function setAdminToken(token: string) {
  adminToken = token;
  sessionStorage.setItem("admin_token", token);
}

export function getAdminToken(): string | null {
  if (!adminToken) {
    adminToken = sessionStorage.getItem("admin_token");
  }
  return adminToken;
}

export function clearAdminToken() {
  adminToken = null;
  sessionStorage.removeItem("admin_token");
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}

export async function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-admin-token": token } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    clearAdminToken();
    window.location.href = "/admin";
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res;
}

export async function adminGet<T>(url: string): Promise<T> {
  const res = await adminFetch(url);
  return res.json();
}

export async function adminPost<T>(url: string, body: any): Promise<T> {
  const res = await adminFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function adminPatch<T>(url: string, body: any): Promise<T> {
  const res = await adminFetch(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function adminDelete(url: string): Promise<void> {
  await adminFetch(url, { method: "DELETE" });
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
