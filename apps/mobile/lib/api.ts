export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  accessToken?: string | null;
  body?: unknown;
};

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const { getApiBaseUrl } = await import("./env");
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options?.body != null) {
    headers["Content-Type"] = "application/json";
  }
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(url, {
    method: options?.method ?? (options?.body != null ? "POST" : "GET"),
    headers,
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof json === "object" &&
      json != null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, json);
  }

  return json as T;
}
