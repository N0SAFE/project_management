import { Component, signal, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormFieldComponent } from '../../../shared/form-field/form-field.component';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { HlmAlertDirective, HlmAlertDescriptionDirective, HlmAlertTitleDirective, HlmAlertIconDirective } from '@spartan-ng/ui-alert-helm';
import { HlmH1Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RouterLink, 
    HlmCardDirective, 
    HlmButtonDirective, 
    HlmInputDirective, 
    HlmSeparatorDirective,
    HlmAlertDirective,
    HlmAlertDescriptionDirective,
    HlmAlertTitleDirective,
    HlmAlertIconDirective,
    HlmH1Directive,
    HlmMutedDirective,
    FormFieldComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = this.auth.loading;
  errorMsg = signal('');
  private redirectTo: string | null = null;

  constructor() {
    effect(() => {
      this.errorMsg.set(this.auth.error() ?? '');
    });
  }

  ngOnInit() {
    this.redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
  }submit() {
    this.errorMsg.set('');
    if (this.form.invalid) {
      return;
    }
    const { email, password } = this.form.getRawValue();
    if (!email || !password) {
      return;
    }
    
    console.log('Login attempt with:', { email });
      this.auth.login({ email, password }).subscribe({      next: (response) => {
        console.log('Login successful:', response);
        console.log('User authenticated:', this.auth.isAuthenticated());
        console.log('User data:', this.auth.user());
        
        toast.success('Login successful', {
          description: 'Welcome back! You have been successfully logged in.'
        });
        
        // Wait a bit for the state to update, then navigate
        setTimeout(() => {
          console.log('Navigation - Auth state:', {
            isAuthenticated: this.auth.isAuthenticated(),
            user: this.auth.user()
          });
          
          // Redirect to the original URL if provided, otherwise to home
          const destination = this.redirectTo || '/';
          this.router.navigate([destination]);
        }, 100);
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMsg.set(error.error?.error || 'Login failed');
        
        // Provide specific error messages based on error status
        let errorMessage = 'Login failed. Please try again.';
        let errorDescription = '';
        
        if (error.status === 401) {
          errorMessage = 'Invalid credentials';
          errorDescription = 'Please check your email and password and try again.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid input';
          errorDescription = error.error?.message || 'Please check your input and try again.';
        } else if (error.status === 403) {
          errorMessage = 'Account access denied';
          errorDescription = 'Your account may be disabled or restricted.';
        } else if (error.status === 0) {
          errorMessage = 'Connection error';
          errorDescription = 'Unable to connect to the server. Please check your internet connection.';
        } else {
          errorDescription = error.error?.message || 'An unexpected error occurred.';
        }
        
        toast.error(errorMessage, {
          description: errorDescription
        });
      }
    });
  }
}
