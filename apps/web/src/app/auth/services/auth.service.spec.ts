import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/auth`;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Handle the initial auth check that happens during service initialization
    const initialAuthCheck = httpMock.expectOne('http://localhost:8080/api/auth/check');
    initialAuthCheck.flush({ authenticated: false }, { status: 401, statusText: 'Unauthorized' });
  });
  afterEach(() => {
    // Handle any remaining auth check requests that might be pending
    const pendingRequests = httpMock.match(() => true);
    pendingRequests.forEach(req => {
      if (req.request.url.includes('/api/auth/check')) {
        req.flush({ authenticated: false }, { status: 401, statusText: 'Unauthorized' });
      } else {
        req.flush({});
      }
    });
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have initial state with user null and not authenticated', () => {
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully and update state', () => {
      const loginRequest = { email: 'test@example.com', password: 'password123' };
      const authResponse = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        tokenType: 'Bearer'
      };

      expect(service.loading()).toBeFalse();

      service.login(loginRequest).subscribe(response => {
        expect(response).toEqual(authResponse);
        expect(service.user()).toEqual({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        });
        expect(service.isAuthenticated()).toBeTrue();
        expect(service.loading()).toBeFalse();
      });

      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      expect(req.request.withCredentials).toBeTrue();
      req.flush(authResponse);
    });

    it('should handle login error', () => {
      const loginRequest = { email: 'test@example.com', password: 'wrongpassword' };
      const errorResponse = { error: 'Invalid credentials' };

      service.login(loginRequest).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          expect(service.user()).toBeNull();
          expect(service.isAuthenticated()).toBeFalse();
          expect(service.loading()).toBeFalse();
          expect(service.error()).toBe('Invalid credentials');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });
    });

    it('should set loading state during login', () => {
      const loginRequest = { email: 'test@example.com', password: 'password123' };

      expect(service.loading()).toBeFalse();

      service.login(loginRequest).subscribe();

      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ userId: 1, username: 'test', email: 'test@example.com', tokenType: 'Bearer' });

      expect(service.loading()).toBeFalse();
    });
  });

  describe('register', () => {    it('should register successfully', () => {
      const registerRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      const authResponse = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        tokenType: 'Bearer'
      };

      service.register(registerRequest).subscribe(response => {
        expect(response).toEqual(authResponse);
        expect(service.user()).toEqual({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        });
        expect(service.isAuthenticated()).toBeTrue();
        expect(service.loading()).toBeFalse();
      });

      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      expect(req.request.withCredentials).toBeTrue();
      req.flush(authResponse);

      expect(service.loading()).toBeFalse();
    });    it('should handle registration error', () => {
      const registerRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      const errorResponse = { error: 'Email already exists' };

      service.register(registerRequest).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          expect(service.user()).toBeNull();
          expect(service.isAuthenticated()).toBeFalse();
          expect(service.loading()).toBeFalse();
          expect(service.error()).toBe('Email already exists');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear state', () => {
      // First set authenticated state
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
      const loginReq = httpMock.expectOne(`${apiUrl}/login`);
      loginReq.flush({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        tokenType: 'Bearer'
      });

      expect(service.isAuthenticated()).toBeTrue();

      // Now logout
      service.logout().subscribe();

      const logoutReq = httpMock.expectOne(`${apiUrl}/logout`);
      expect(logoutReq.request.method).toBe('POST');
      expect(logoutReq.request.withCredentials).toBeTrue();
      logoutReq.flush({});

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.loading()).toBeFalse();
    });

    it('should clear state even if logout request fails', () => {
      // First set authenticated state
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
      const loginReq = httpMock.expectOne(`${apiUrl}/login`);
      loginReq.flush({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        tokenType: 'Bearer'
      });

      service.logout().subscribe();

      const logoutReq = httpMock.expectOne(`${apiUrl}/logout`);
      logoutReq.flush({}, { status: 500, statusText: 'Server Error' });

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.loading()).toBeFalse();
    });
  });

  describe('checkAuthStatus', () => {
    it('should update state when auth check succeeds', () => {
      const authResponse = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        tokenType: 'Bearer'
      };

      service.checkAuthStatus().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/check`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBeTrue();
      req.flush(authResponse);

      expect(service.user()).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should clear state when auth check fails', () => {
      service.checkAuthStatus().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/check`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', () => {
      const authResponse = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        tokenType: 'Bearer'
      };

      service.refreshToken().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/refresh-token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBeTrue();
      req.flush(authResponse);

      expect(service.user()).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should handle refresh token failure', () => {
      service.refreshToken().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/refresh-token`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('External token refresh handlers', () => {
    it('should handle external token refresh success', () => {
      const authResponse = {
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        tokenType: 'Bearer'
      };

      service.handleTokenRefreshSuccess(authResponse);

      expect(service.user()).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      });
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should handle external token refresh failure', () => {
      // First set authenticated state
      service.handleTokenRefreshSuccess({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        tokenType: 'Bearer'
      });

      expect(service.isAuthenticated()).toBeTrue();

      service.handleTokenRefreshFailure();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });
  });
});
