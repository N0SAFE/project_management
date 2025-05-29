import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  userId: number;
  username: string;
  email: string;
  tokenType: string;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject dependencies at the top level of the interceptor
  const http = inject(HttpClient);
  const router = inject(Router);
  
  console.log('Interceptor check:', {
    url: req.url,
    isApiRequest: req.url.includes('/api/'),
    isAuthEndpoint: req.url.includes('/api/auth/'),
    withCredentials: req.withCredentials
  });

  // For API requests, ensure withCredentials is true to include cookies
  if (req.url.includes('/api/')) {
    const authReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('Adding withCredentials to request:', req.url);
    
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          console.error('Authentication error:', error);
          
          // If it's not an auth endpoint and we get 401, try to refresh token
          if (!req.url.includes('/api/auth/') && error.status === 401) {
            console.log('Attempting token refresh...');
            
            return http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh-token`, {}, {
              withCredentials: true
            }).pipe(
              tap((response: AuthResponse) => {
                // We can't inject AuthService here due to circular dependency
                // The auth state will be updated when the app makes its next auth check
                console.log('Token refresh successful in interceptor:', response);
              }),
              switchMap(() => {
                // Retry the original request after refresh
                console.log('Token refreshed, retrying request');
                return next(authReq);
              }),
              catchError((refreshError) => {
                console.error('Token refresh failed:', refreshError);
                // Redirect to login on refresh failure
                router.navigate(['/login']);
                return throwError(() => error);
              })
            );
          }
          
          // For auth endpoints or non-401 errors, redirect to login
          if (error.status === 401) {
            router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
