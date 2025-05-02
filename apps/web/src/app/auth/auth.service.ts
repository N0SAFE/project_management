import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

  // Signals for state
  private _user = signal<any | null>(this.getUserFromStorage());
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  readonly user = computed(() => this._user());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  constructor(private http: HttpClient) {}

  register(data: { username: string; email: string; password: string }) {
    this._loading.set(true);
    this._error.set(null);
    return this.http.post(`${this.apiUrl}/register`, data).pipe(
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
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap({
        next: (user: any) => {
          if (user && user.id) {
            localStorage.setItem('user', JSON.stringify(user));
            this._user.set(user);
          }
          this._loading.set(false);
        },
        error: (err) => {
          this._loading.set(false);
          this._error.set(err.error?.error || 'Login failed');
        }
      })
    );
  }


  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('user');
    }
    this._user.set(null);
  }

  getUserFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  isAuthenticated() {
    return !!this._user();
  }
}
