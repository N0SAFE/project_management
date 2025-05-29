import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  console.log('Auth guard check for route:', state.url);
  
  // Check if already authenticated
  if (auth.isAuthenticated()) {
    console.log('Auth guard: Already authenticated');
    return true;
  }
  
  // Check authentication status with server
  return auth.checkAuthStatus().pipe(
    map(() => {
      const isAuthenticated = auth.isAuthenticated();
      const user = auth.user();
      
      console.log('Auth guard server check result:', {
        isAuthenticated,
        user,
        route: state.url
      });
      
      if (isAuthenticated) {
        console.log('Auth guard: Access granted');
        return true;
      } else {
        console.log('Auth guard: redirecting to login');
        router.navigate(['/login']);
        return false;
      }
    }),
    catchError(() => {
      console.log('Auth guard: Server check failed, redirecting to login');
      router.navigate(['/login']);
      return of(false);
    })
  );
};
