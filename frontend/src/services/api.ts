const BASE_URL = '/api/v1';

interface RequestOptions extends RequestInit {
  json?: any;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${BASE_URL}${path}`;
    
    // Set headers
    const headers = new Headers(options.headers || {});
    if (options.json) {
      headers.set('Content-Type', 'application/json');
      options.body = JSON.stringify(options.json);
    }
    
    // Inject auth header if token exists
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }
    
    options.headers = headers;

    try {
      const response = await fetch(url, options);

      // Handle token expiration (401) and attempt refresh
      if (response.status === 401 && this.refreshToken && path !== '/auth/token' && path !== '/auth/refresh') {
        const newAccessToken = await this.handleTokenRefresh();
        if (newAccessToken) {
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          const retryResponse = await fetch(url, options);
          return this.parseResponse<T>(retryResponse);
        }
      }

      return this.parseResponse<T>(response);
    } catch (error) {
      console.error(`API Request Failure on ${path}:`, error);
      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }
    
    return response.json();
  }

  private async handleTokenRefresh(): Promise<string | null> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        if (!this.refreshToken) throw new Error('No refresh token');

        const response = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Refresh token invalid');
        }

        const data = await response.json();
        const newAccess = data.access_token;
        
        this.accessToken = newAccess;
        localStorage.setItem('access_token', newAccess);
        
        return newAccess;
      } catch (error) {
        console.warn('Failed to refresh authentication session:', error);
        this.clearTokens();
        window.dispatchEvent(new Event('auth-session-expired'));
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // HTTP helper verbs
  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, json?: any, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'POST', json });
  }

  put<T>(path: string, json?: any, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'PUT', json });
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
