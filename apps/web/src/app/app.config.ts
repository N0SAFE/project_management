import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import {
  QueryClient,
  provideTanStackQuery,
  withDevtools,
} from '@tanstack/angular-query-experimental';
import { authInterceptor } from './auth/interceptors/auth.interceptor';
import { ssrCookieInterceptor } from './auth/interceptors/ssr-cookie.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([ssrCookieInterceptor, authInterceptor])),
    provideClientHydration(withEventReplay()),
    provideTanStackQuery(
      new QueryClient(),
      withDevtools(() => ({ loadDevtools: 'auto' }))
    ),
  ],
};
