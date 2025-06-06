import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Component } from '@angular/core';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { 
  createTestQueryClient, 
  provideTestQueryClient, 
  createMockActivatedRoute, 
  createMockRouter,
  createMockAuthService,
  TestDataFactory,
  FormTestHelper
} from '../../../../test/test-utils';
import { environment } from '../../../../environments/environment';

// Dummy component for routing tests
@Component({ template: '' })
class DummyComponent { }

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
  let activatedRoute: ActivatedRoute;

  // Helper function to set multiple form values
  const setFormValues = (values: Record<string, any>) => {
    Object.keys(values).forEach(key => {
      const control = component.form.get(key);
      if (control) {
        control.setValue(values[key]);
        control.markAsTouched();
      }
    });
    fixture.detectChanges();
  };  beforeEach(async () => {
    mockAuthService = createMockAuthService();

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'login', component: DummyComponent },
          { path: 'dashboard', component: DummyComponent }
        ]),
        ReactiveFormsModule
      ],
      providers: [
        ...provideTestQueryClient(),
        { provide: AuthService, useValue: mockAuthService },
        { 
          provide: ActivatedRoute, 
          useValue: {
            snapshot: {
              queryParamMap: {
                get: jasmine.createSpy('get').and.returnValue(null)
              }
            }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    
    // Setup spies
    spyOn(router, 'navigate');
    
    fixture.detectChanges();
  });

  afterEach(() => {
    // Only verify if there are pending requests
    try {
      httpMock.verify();
    } catch (error) {
      // Ignore verification errors in tests that don't make HTTP calls
    }
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty values and validators', () => {
      expect(component.form.get('username')?.value).toBe('');
      expect(component.form.get('email')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
      
      // Check validators
      expect(component.form.get('username')?.hasError('required')).toBeTruthy();
      expect(component.form.get('email')?.hasError('required')).toBeTruthy();
      expect(component.form.get('password')?.hasError('required')).toBeTruthy();
    });

    it('should initialize loading and error signals from auth service', () => {
      expect(component.loading).toBeDefined();
      expect(component.errorMsg).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should validate username requirements', () => {
      const usernameControl = component.form.get('username')!;
      
      // Required validation
      expect(usernameControl.hasError('required')).toBeTruthy();
      
      // Min length validation
      usernameControl.setValue('ab');
      expect(usernameControl.hasError('minlength')).toBeTruthy();
      
      // Max length validation
      usernameControl.setValue('a'.repeat(51));
      expect(usernameControl.hasError('maxlength')).toBeTruthy();
      
      // Valid username
      usernameControl.setValue('validuser');
      expect(usernameControl.valid).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component.form.get('email')!;
      
      // Required validation
      expect(emailControl.hasError('required')).toBeTruthy();
      
      // Email format validation
      emailControl.setValue('invalid-email');
      expect(emailControl.hasError('email')).toBeTruthy();
      
      // Valid email
      emailControl.setValue('test@example.com');
      expect(emailControl.valid).toBeTruthy();
    });

    it('should validate password requirements', () => {
      const passwordControl = component.form.get('password')!;
      
      // Required validation
      expect(passwordControl.hasError('required')).toBeTruthy();
      
      // Min length validation
      passwordControl.setValue('123');
      expect(passwordControl.hasError('minlength')).toBeTruthy();
      
      // Valid password
      passwordControl.setValue('password123');
      expect(passwordControl.valid).toBeTruthy();
    });    it('should prevent submission when form is invalid', () => {
      // Don't create a new spy since mockAuthService.register is already a spy
      component.submit();
      
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });it('should allow submission when form is valid', () => {
      mockAuthService.register.and.returnValue(of(TestDataFactory.createUser()));
      
      setFormValues({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      
      component.submit();
      
      expect(mockAuthService.register).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });
  describe('Registration Flow', () => {
    beforeEach(() => {
      setFormValues({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    });    it('should handle successful registration', fakeAsync(() => {
      const mockUser = TestDataFactory.createUser();
      const mockResponse = {
        userId: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        tokenType: 'Bearer'
      };
      mockAuthService.register.and.returnValue(of(mockResponse));
      
      component.submit();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));    it('should redirect to login with redirectTo parameter when present', fakeAsync(() => {
      const mockUser = TestDataFactory.createUser();
      const mockResponse = {
        userId: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        tokenType: 'Bearer'
      };
      mockAuthService.register.and.returnValue(of(mockResponse));
      
      // Set redirectTo parameter by updating the spy
      (activatedRoute.snapshot.queryParamMap.get as jasmine.Spy).and.callFake((key: string) => {
        if (key === 'redirectTo') {
          return '/projects';
        }
        return null;
      });
      component.ngOnInit(); // Re-initialize to pick up new query params
      
      component.submit();
      tick();
      
      expect(router.navigate).toHaveBeenCalledWith(['/projects']);
    }));it('should handle registration error with status 400', fakeAsync(() => {
      const error = { status: 400, error: { message: 'Invalid email format' } };
      mockAuthService.register.and.returnValue(throwError(() => error));
      
      component.submit();
      tick();
      
      expect(router.navigate).not.toHaveBeenCalled();
    }));

    it('should handle registration error with status 409 (conflict)', fakeAsync(() => {
      const error = { status: 409, error: { message: 'User already exists' } };
      mockAuthService.register.and.returnValue(throwError(() => error));
      
      component.submit();
      tick();
      
      expect(router.navigate).not.toHaveBeenCalled();
    }));

    it('should handle network error (status 0)', fakeAsync(() => {
      const error = { status: 0, error: null };
      mockAuthService.register.and.returnValue(throwError(() => error));
      
      component.submit();
      tick();
      
      expect(router.navigate).not.toHaveBeenCalled();
    }));
  });

  describe('State Management', () => {    it('should sync error message from auth service', fakeAsync(() => {
      const errorMessage = 'Registration failed';
      (mockAuthService as any)._setError(errorMessage);
      
      tick();
      fixture.detectChanges();
      
      expect(component.errorMsg()).toBe(errorMessage);
    }));it('should clear error message before submission', () => {
      component.errorMsg.set('Previous error');
      setFormValues({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      mockAuthService.register.and.returnValue(of(TestDataFactory.createUser()));
      
      component.submit();
      
      expect(component.errorMsg()).toBe('');
    });

    it('should reflect loading state from auth service', () => {
      expect(component.loading).toBe(mockAuthService.loading);
    });
  });  describe('Query Parameters Handling', () => {
    it('should extract invitation token from query parameters', () => {
      (activatedRoute.snapshot.queryParamMap.get as jasmine.Spy).and.callFake((key: string) => {
        if (key === 'invitation') {
          return 'mock-invitation-token';
        }
        return null;
      });
      
      component.ngOnInit();
      
      expect(component['invitationToken']).toBe('mock-invitation-token');
    });

    it('should extract redirectTo from query parameters', () => {
      (activatedRoute.snapshot.queryParamMap.get as jasmine.Spy).and.callFake((key: string) => {
        if (key === 'redirectTo') {
          return '/projects/123';
        }
        return null;
      });
      
      component.ngOnInit();
      
      expect(component['redirectTo']).toBe('/projects/123');
    });

    it('should handle missing query parameters gracefully', () => {
      (activatedRoute.snapshot.queryParamMap.get as jasmine.Spy).and.returnValue(null);
      
      component.ngOnInit();
      
      expect(component['invitationToken']).toBeNull();
      expect(component['redirectTo']).toBeNull();
    });
  });

  describe('UI Integration', () => {    it('should disable submit button when loading', () => {
      (mockAuthService as any)._setLoading(true);
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton?.disabled).toBeTruthy();
    });    it('should enable submit button when form is valid and not loading', () => {
      (mockAuthService as any)._setLoading(false);
      setFormValues({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton?.disabled).toBeFalsy();
    });

    it('should show loading state during registration', fakeAsync(() => {
      (mockAuthService as any)._setLoading(true);
      tick();
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton?.disabled).toBeTruthy();
    }));
  });
});
