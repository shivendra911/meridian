/**
 * PlaceFlow / Meridian — Core API Client (Phase 4).
 *
 * Rules:
 * - Credentials included on all requests (HttpOnly session cookies).
 * - Automatic CSRF handshake on boot / mutating requests.
 * - X-CSRFToken header attached on POST, PUT, PATCH, DELETE.
 * - Strict Zero-Header Leaks: NEVER send X-Tenant-ID or X-Actor-ID.
 * - Global 401/403 dispatching and typed ApiError rejection.
 */

import { ApiError } from './errors';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuthRedirect?: boolean;
}

type UnauthorizedHandler = () => void;
type ForbiddenHandler = (error: ApiError) => void;

class ApiClient {
  private csrfToken: string | null = null;
  private csrfPromise: Promise<string | null> | null = null;
  private onUnauthorizedCallbacks: Set<UnauthorizedHandler> = new Set();
  private onForbiddenCallbacks: Set<ForbiddenHandler> = new Set();

  /**
   * Register a callback for 401 Unauthorized responses.
   */
  public onUnauthorized(cb: UnauthorizedHandler): () => void {
    this.onUnauthorizedCallbacks.add(cb);
    return () => this.onUnauthorizedCallbacks.delete(cb);
  }

  /**
   * Register a callback for 403 Forbidden responses.
   */
  public onForbidden(cb: ForbiddenHandler): () => void {
    this.onForbiddenCallbacks.add(cb);
    return () => this.onForbiddenCallbacks.delete(cb);
  }

  /**
   * Extracts CSRF token from document.cookie if available.
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  /**
   * Fetches CSRF token from backend /api/auth/csrf/ endpoint.
   */
  public async fetchCsrf(): Promise<string | null> {
    const existingCookie = this.getCookie('csrftoken');
    if (existingCookie) {
      this.csrfToken = existingCookie;
      return existingCookie;
    }

    if (this.csrfPromise) return this.csrfPromise;

    this.csrfPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/csrf/`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          this.csrfToken = data.csrfToken || this.getCookie('csrftoken') || null;
          return this.csrfToken;
        }
      } catch (err) {
        console.warn('Failed to fetch CSRF token:', err);
      } finally {
        this.csrfPromise = null;
      }
      return null;
    })();

    return this.csrfPromise;
  }

  /**
   * Core request dispatcher.
   */
  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const method: HttpMethod = (options.method as HttpMethod) || 'GET';
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    // Ensure CSRF token is present for mutating operations
    if (isMutating && !this.csrfToken) {
      await this.fetchCsrf();
    }

    // Build URL with query params
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${API_BASE}${cleanEndpoint}`);
    if (options.params) {
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }

    // Build request headers — STRICTLY NO X-Tenant-ID OR X-Actor-ID
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (isMutating && this.csrfToken) {
      headers['X-CSRFToken'] = this.csrfToken;
    }

    let bodyData: BodyInit | undefined = undefined;
    if (options.body !== undefined) {
      if (options.body instanceof FormData || options.body instanceof Blob) {
        bodyData = options.body;
      } else {
        headers['Content-Type'] = 'application/json';
        bodyData = JSON.stringify(options.body);
      }
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        ...options,
        method,
        headers,
        body: bodyData,
        credentials: 'include', // Mandate HttpOnly cookie transmission
      });
    } catch (networkErr: any) {
      throw new ApiError(0, 'NetworkError', networkErr?.message || 'Network request failed');
    }

    // Update CSRF token from cookie if changed
    const freshCookie = this.getCookie('csrftoken');
    if (freshCookie) {
      this.csrfToken = freshCookie;
    }

    // Handle responses
    if (!response.ok) {
      let errPayload: any = null;
      try {
        errPayload = await response.json();
      } catch {
        // Fallback for non-JSON error pages
      }

      const code = errPayload?.error || errPayload?.code || `HTTP_${response.status}`;
      const message = errPayload?.message || errPayload?.detail || response.statusText;
      const apiErr = new ApiError(response.status, code, message, errPayload);

      if (response.status === 401) {
        if (!options.skipAuthRedirect) {
          this.onUnauthorizedCallbacks.forEach((cb) => {
            try {
              cb();
            } catch (e) {
              console.error('Error in onUnauthorized handler:', e);
            }
          });
        }
      } else if (response.status === 403) {
        this.onForbiddenCallbacks.forEach((cb) => {
          try {
            cb(apiErr);
          } catch (e) {
            console.error('Error in onForbidden handler:', e);
          }
        });
      }

      throw apiErr;
    }

    // 204 No Content
    if (response.status === 204) {
      return null as unknown as T;
    }

    return response.json();
  }

  public get<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public patch<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const client = new ApiClient();

