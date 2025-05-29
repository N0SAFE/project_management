import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const ssrCookieInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // Only apply this interceptor during SSR
  if (isPlatformServer(platformId)) {
    console.log('SSR: Processing request:', req.url);

    console.log('SSR: Auth check request detected during SSR');

    // For now, we'll mark these requests to be skipped during SSR
    // and handled after hydration on the client side
    // This is a common pattern for authentication in SSR applications

    // We could also try to access cookies through global context if available
    try {
      // Check if we're in a context where we can access the original request
      const globalThis = global as any;
      if (
        globalThis.__express_request &&
        globalThis.__express_request.headers.cookie
      ) {
        console.log(
          'SSR: Found cookies in global context:',
          globalThis.__express_request.headers.cookie
        );

        const modifiedReq = req.clone({
          setHeaders: {
            Cookie: globalThis.__express_request.headers.cookie,
          },
        });

        return next(modifiedReq);
      }
    } catch (error) {
      console.log('SSR: Could not access global request context:', error);
    }

    console.log(
      'SSR: Proceeding with request without cookies (will be handled on client)'
    );
  }

  return next(req);
};
