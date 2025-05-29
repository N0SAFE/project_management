import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  userId: number;
  username: string;
  email: string;
  tokenType: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // Signals for state
  private _user = signal<User | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _isAuthenticated = signal(false);

  readonly user = computed(() => this._user());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly isAuthenticated = computed(() => this._isAuthenticated());  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Check authentication status on service initialization
    // Only do this on the browser to avoid SSR issues
    if (isPlatformBrowser(this.platformId)) {
      this.checkAuthStatus().subscribe();
    }
  }

  register(data: { username: string; email: string; password: string }) {
    this._loading.set(true);
    this._error.set(null);
    return this.http.post(`${this.apiUrl}/register`, data, {
      withCredentials: true
    }).pipe(
      tap({
        next: () => {
          this._loading.set(false);
        },
        error: (err) => {
          this._loading.set(false);
          this._error.set(err.error?.error || 'Inscription échouée');
        }
      })
    );
  }

  login(data: { email: string; password: string }) {
    this._loading.set(true);
    this._error.set(null);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data, {
      withCredentials: true
    }).pipe(
      tap({
        next: (response: AuthResponse) => {
          console.log('Login response received:', response);
          if (response && response.userId) {
            // Extract user data from the auth response
            const user: User = {
              id: response.userId,
              username: response.username,
              email: response.email
            };
            
            // Update signals - tokens are now stored in HTTP-only cookies
            this._user.set(user);
            this._isAuthenticated.set(true);
            
            console.log('Login successful - user stored, cookies set by server:', {
              user,
              tokenType: response.tokenType,
              isAuthenticated: this._isAuthenticated()
            });
          }
          this._loading.set(false);
        },
        error: (err) => {
          this._loading.set(false);
          this._error.set(err.error?.error || 'Login failed');
          console.error('Login error:', err);
        }
      })
    );
  }

  logout() {
    this._loading.set(true);
    return this.http.post(`${this.apiUrl}/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap({
        next: () => {
          this._user.set(null);
          this._isAuthenticated.set(false);
          this._loading.set(false);
          console.log('Logout successful - cookies cleared by server');
        },
        error: (err) => {
          // Even if logout fails on server, clear local state
          this._user.set(null);
          this._isAuthenticated.set(false);
          this._loading.set(false);
          console.error('Logout error:', err);
        }
      }),
      catchError(() => {
        // Always clear local state
        this._user.set(null);
        this._isAuthenticated.set(false);
        this._loading.set(false);
        return of(null);
      })
    );
  }
  checkAuthStatus() {
    const isServer = !isPlatformBrowser(this.platformId);
    console.log(`Auth check called on ${isServer ? 'server' : 'client'}`);
    
    return this.http.get<AuthResponse>(`${this.apiUrl}/check`, {
      withCredentials: true
    }).pipe(
      tap({
        next: (response: AuthResponse) => {
          console.log(`Auth check successful on ${isServer ? 'server' : 'client'}:`, response);
          if (response && response.userId) {
            const user: User = {
              id: response.userId,
              username: response.username,
              email: response.email
            };
            this._user.set(user);
            this._isAuthenticated.set(true);
          } else {
            this._user.set(null);
            this._isAuthenticated.set(false);
          }
        },
        error: (err) => {
          console.log(`Auth check failed on ${isServer ? 'server' : 'client'}:`, err);
          this._user.set(null);
          this._isAuthenticated.set(false);
        }
      }),
      catchError(() => {
        this._user.set(null);
        this._isAuthenticated.set(false);
        return of(null);
      })
    );
  }
  refreshToken() {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, {}, {
      withCredentials: true
    }).pipe(
      tap({
        next: (response: AuthResponse) => {
          console.log('Token refresh successful:', response);
          if (response && response.userId) {
            const user: User = {
              id: response.userId,
              username: response.username,
              email: response.email
            };
            this._user.set(user);
            this._isAuthenticated.set(true);
          }
        },
        error: (err) => {
          console.error('Refresh token failed:', err);
          this._user.set(null);
          this._isAuthenticated.set(false);
        }
      }),
      catchError(() => {
        this._user.set(null);
        this._isAuthenticated.set(false);
        return of(null);
      })
    );
  }

  // Method to handle external token refresh (called from interceptor)
  handleTokenRefreshSuccess(response: AuthResponse) {
    console.log('External token refresh successful:', response);
    if (response && response.userId) {
      const user: User = {
        id: response.userId,
        username: response.username,
        email: response.email
      };
      this._user.set(user);
      this._isAuthenticated.set(true);
    }
  }

  // Method to handle external token refresh failure (called from interceptor)
  handleTokenRefreshFailure() {
    console.log('External token refresh failed, clearing auth state');
    this._user.set(null);
    this._isAuthenticated.set(false);
  }
}
