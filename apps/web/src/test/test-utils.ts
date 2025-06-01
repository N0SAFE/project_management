import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { Provider, EnvironmentProviders, Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

/**
 * Creates a QueryClient for testing with comprehensive configuration
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Provider for QueryClient in tests
 */
export function provideTestQueryClient(): Provider[] {
  const queryClient = createTestQueryClient();
  return [
    { provide: QueryClient, useValue: queryClient }
  ];
}

/**
 * Mock ActivatedRoute with paramMap and query params
 */
export function createMockActivatedRoute(
  params: Record<string, string> = {},
  queryParams: Record<string, string> = {}
): Partial<ActivatedRoute> {
  return {
    params: of(params),
    queryParams: of(queryParams),
    fragment: of(null),
    data: of({}),
    url: of([]),
    outlet: 'primary',
    routeConfig: null,
    root: {} as any,
    parent: null,
    firstChild: null,
    children: [],
    pathFromRoot: [] as any,
    snapshot: {
      params,
      queryParams,
      fragment: null,
      data: {},
      url: [],
      outlet: 'primary',
      component: null,
      routeConfig: null,
      root: {} as any,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: [] as any,
      title: undefined,
      paramMap: {
        get: (key: string) => params[key] || null,
        has: (key: string) => key in params,
        getAll: (key: string) => params[key] ? [params[key]] : [],
        keys: Object.keys(params)
      },
      queryParamMap: {
        get: (key: string) => queryParams[key] || null,
        has: (key: string) => key in queryParams,
        getAll: (key: string) => queryParams[key] ? [queryParams[key]] : [],
        keys: Object.keys(queryParams)
      }
    } as any
  };
}

/**
 * Mock Router for testing navigation
 */
export function createMockRouter(): jasmine.SpyObj<Router> {
  return jasmine.createSpyObj('Router', [
    'navigate',
    'navigateByUrl',
    'createUrlTree',
    'serializeUrl',
    'parseUrl',
    'isActive',
    'routerState'
  ], {
    events: of(),
    url: '/',
    routerState: {
      root: {},
      snapshot: {
        root: {}
      }
    }
  });
}

/**
 * Test data factories
 */
export const TestDataFactory = {
  createUser: (overrides: Partial<any> = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  createProject: (overrides: Partial<any> = {}) => ({
    id: 1,
    name: 'Test Project',
    description: 'Test project description',
    status: 'ACTIVE',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ownerId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [],
    tasks: [],
    ...overrides
  }),

  createTask: (overrides: Partial<any> = {}) => ({
    id: 1,
    title: 'Test Task',
    description: 'Test task description',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    projectId: 1,
    assigneeId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  createLoginRequest: (overrides: Partial<any> = {}) => ({
    username: 'testuser',
    password: 'password123',
    ...overrides
  }),

  createRegisterRequest: (overrides: Partial<any> = {}) => ({
    username: 'newuser',
    email: 'newuser@example.com',
    password: 'password123',
    firstName: 'New',
    lastName: 'User',
    ...overrides
  }),

  createAuthResponse: (overrides: Partial<any> = {}) => ({
    token: 'mock-jwt-token',
    user: TestDataFactory.createUser(),
    ...overrides
  })
};

/**
 * HTTP Mock helpers
 */
export class HttpMockHelper {
  constructor(private httpMock: HttpTestingController) {}

  expectGetRequest(url: string, response: any, status = 200) {
    const req = this.httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush(response, { status, statusText: status === 200 ? 'OK' : 'Error' });
  }

  expectPostRequest(url: string, expectedBody: any, response: any, status = 201) {
    const req = this.httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(expectedBody);
    req.flush(response, { status, statusText: status === 201 ? 'Created' : 'Error' });
  }

  expectPutRequest(url: string, expectedBody: any, response: any, status = 200) {
    const req = this.httpMock.expectOne(url);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(expectedBody);
    req.flush(response, { status, statusText: status === 200 ? 'OK' : 'Error' });
  }

  expectDeleteRequest(url: string, status = 204) {
    const req = this.httpMock.expectOne(url);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status, statusText: status === 204 ? 'No Content' : 'Error' });
  }

  expectErrorRequest(url: string, errorMessage: string, status = 400) {
    const req = this.httpMock.expectOne(url);
    req.flush({ message: errorMessage }, { status, statusText: 'Error' });
  }

  verifyNoOutstandingRequests() {
    this.httpMock.verify();
  }
}

/**
 * Form testing utilities
 */
export class FormTestHelper {
  static setFormValue(fixture: any, formSelector: string, values: Record<string, any>) {
    const form = fixture.debugElement.nativeElement.querySelector(formSelector);
    Object.keys(values).forEach(key => {
      const input = form.querySelector(`[name="${key}"], [formControlName="${key}"]`);
      if (input) {
        input.value = values[key];
        input.dispatchEvent(new Event('input'));
        input.dispatchEvent(new Event('blur'));
      }
    });
    fixture.detectChanges();
  }

  static getFormErrors(fixture: any, formSelector: string): Record<string, string[]> {
    const form = fixture.debugElement.nativeElement.querySelector(formSelector);
    const errors: Record<string, string[]> = {};
    
    const errorElements = form.querySelectorAll('.error, .invalid, [data-testid*="error"]');
    errorElements.forEach((element: Element) => {
      const fieldName = element.getAttribute('data-field') || 'general';
      if (!errors[fieldName]) {
        errors[fieldName] = [];
      }
      errors[fieldName].push(element.textContent?.trim() || '');
    });
    
    return errors;
  }

  static isFormValid(fixture: any, formSelector: string): boolean {
    const form = fixture.debugElement.nativeElement.querySelector(formSelector);
    return form && !form.classList.contains('invalid') && !form.querySelector('.error, .invalid');
  }
}

/**
 * Query testing utilities
 */
export class QueryTestHelper {
  static expectQueryToHaveBeenCalled(queryClient: QueryClient, queryKey: any[]) {
    const cache = queryClient.getQueryCache();
    const query = cache.find({ queryKey });
    expect(query).toBeTruthy();
  }

  static expectMutationToHaveBeenCalled(queryClient: QueryClient, mutationKey?: any[]) {
    const cache = queryClient.getMutationCache();
    const mutations = cache.getAll();
    if (mutationKey) {
      const mutation = mutations.find(m => JSON.stringify(m.options.mutationKey) === JSON.stringify(mutationKey));
      expect(mutation).toBeTruthy();
    } else {
      expect(mutations.length).toBeGreaterThan(0);
    }
  }

  static clearQueryCache(queryClient: QueryClient) {
    queryClient.clear();
  }

  static setQueryData(queryClient: QueryClient, queryKey: any[], data: any) {
    queryClient.setQueryData(queryKey, data);
  }

  static invalidateQueries(queryClient: QueryClient, queryKey?: any[]) {
    queryClient.invalidateQueries({ queryKey });
  }
}

/**
 * Component testing utilities
 */
export class ComponentTestHelper {
  static async waitForAsyncOperations(fixture: any, timeout = 1000): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        fixture.detectChanges();
        resolve();
      }, timeout);
    });
  }

  static clickElement(fixture: any, selector: string) {
    const element = fixture.debugElement.nativeElement.querySelector(selector);
    expect(element).toBeTruthy(`Element with selector "${selector}" not found`);
    element.click();
    fixture.detectChanges();
  }

  static getElementText(fixture: any, selector: string): string {
    const element = fixture.debugElement.nativeElement.querySelector(selector);
    return element ? element.textContent.trim() : '';
  }

  static isElementVisible(fixture: any, selector: string): boolean {
    const element = fixture.debugElement.nativeElement.querySelector(selector);
    return element && element.offsetParent !== null;
  }

  static getElementAttribute(fixture: any, selector: string, attribute: string): string | null {
    const element = fixture.debugElement.nativeElement.querySelector(selector);
    return element ? element.getAttribute(attribute) : null;
  }
}

@Component({
  template: `<div>Mock Test Component</div>`,
  standalone: true,
  imports: []
})
export class MockTestComponent {}

/**
 * Mock AuthService for testing
 */
export function createMockAuthService() {
  // Create writable signals for reactive behavior
  const userSignal = signal<any>(null);
  const loadingSignal = signal<boolean>(false);
  const errorSignal = signal<string | null>(null);
  const isAuthenticatedSignal = signal<boolean>(false);
  
  return {
    // Angular signals that can be updated
    user: userSignal,
    loading: loadingSignal,
    error: errorSignal,
    isAuthenticated: isAuthenticatedSignal,
    
    // Methods as spies
    login: jasmine.createSpy('login').and.returnValue(of({})),
    register: jasmine.createSpy('register').and.returnValue(of({})),
    logout: jasmine.createSpy('logout').and.returnValue(of({})),
    refreshToken: jasmine.createSpy('refreshToken').and.returnValue(of({})),
    checkAuthStatus: jasmine.createSpy('checkAuthStatus').and.returnValue(of({})),
    handleExternalTokenRefresh: jasmine.createSpy('handleExternalTokenRefresh').and.returnValue(of({})),
    
    // Helper methods for testing
    _setError: (error: string | null) => errorSignal.set(error),
    _setLoading: (loading: boolean) => loadingSignal.set(loading),
    _setUser: (user: any) => userSignal.set(user),
    _setAuthenticated: (authenticated: boolean) => isAuthenticatedSignal.set(authenticated)
  };
}
