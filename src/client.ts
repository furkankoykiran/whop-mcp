// ============================================================
//  Whop API – HTTP Client
//  Wraps fetch with auth, error handling, and rate-limit logic
// ============================================================

const BASE_URL = "https://api.whop.com/api/v1";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;

function getApiKey(): string {
    const key = process.env["WHOP_API_KEY"];
    if (!key || key.trim() === "") {
        throw new Error(
            "WHOP_API_KEY environment variable is not set. " +
            "Please add it to your environment before starting the server."
        );
    }
    return key.trim();
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WhopApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly body: unknown
    ) {
        super(message);
        this.name = "WhopApiError";
    }
}

async function doFetch<T>(
    path: string,
    options: RequestInit = {},
    attempt = 1
): Promise<T> {
    const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    let response: Response;
    try {
        response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getApiKey()}`,
                ...(options.headers ?? {}),
            },
        });
    } catch (err) {
        clearTimeout(timer);
        if (attempt < MAX_RETRIES) {
            await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
            return doFetch<T>(path, options, attempt + 1);
        }
        throw new WhopApiError(`Network error: ${String(err)}`, 0, null);
    }
    clearTimeout(timer);

    // Rate-limit: wait and retry
    if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "2");
        if (attempt <= MAX_RETRIES) {
            await delay(retryAfter * 1000);
            return doFetch<T>(path, options, attempt + 1);
        }
        throw new WhopApiError("Rate limit exceeded", 429, null);
    }

    let body: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        body = await response.json();
    } else {
        body = await response.text();
    }

    if (!response.ok) {
        const errBody = body as any;
        const message =
            errBody?.message ??
            errBody?.error ??
            (typeof body === 'object' ? JSON.stringify(body) : String(body)) ??
            `HTTP ${response.status}: ${response.statusText}`;
        throw new WhopApiError(String(message), response.status, body);
    }

    return body as T;
}

// ── Public helpers ──────────────────────────────────────────

export function whopGet<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = params
        ? `${path}?${buildQuery(params)}`
        : path;
    return doFetch<T>(url, { method: "GET" });
}

export function whopPost<T>(path: string, body?: unknown): Promise<T> {
    return doFetch<T>(path, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

export function whopPatch<T>(path: string, body?: unknown): Promise<T> {
    return doFetch<T>(path, {
        method: "PATCH",
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

export function whopDelete<T>(path: string): Promise<T> {
    return doFetch<T>(path, { method: "DELETE" });
}

// ── Utilities ────────────────────────────────────────────────

export function buildQuery(
    params: Record<string, string | number | boolean | undefined>
): string {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
            q.set(k, String(v));
        }
    }
    return q.toString();
}

export function formatApiError(err: unknown): string {
    if (err instanceof WhopApiError) {
        if (err.status === 401) {
            return "Unauthorized – check your WHOP_API_KEY and make sure it has the required permissions.";
        }
        if (err.status === 403) {
            return "Forbidden – the API key does not have permission to perform this action.";
        }
        if (err.status === 404) {
            return `Not found – the requested resource does not exist: ${err.message}`;
        }
        return `Whop API error (${err.status}): ${err.message}`;
    }
    if (err instanceof Error) {
        return `Error: ${err.message}`;
    }
    return `Unknown error: ${String(err)}`;
}
