import { API_URL } from "./config";
import { getCookie } from "./cookies";

let refreshPromise: Promise<boolean> | null = null;

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const csrfToken = getCookie("af_csrf");
      const response = await fetch(buildUrl("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
      });

      return response.ok;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: { retryOnAuth?: boolean } = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  const csrfToken = getCookie("af_csrf");

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  if (
    response.status === 401 &&
    options.retryOnAuth !== false &&
    !path.endsWith("/api/auth/refresh") &&
    !path.endsWith("/api/auth/logout")
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch(path, init, { retryOnAuth: false });
    }
  }

  return response;
}
