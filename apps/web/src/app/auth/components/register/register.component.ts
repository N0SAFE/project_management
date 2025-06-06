import { Component, signal, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { InvitationService } from '../../services/invitation.service';
import { FormFieldComponent } from '../../../shared/form-field/form-field.component';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import {
  HlmAlertDirective,
  HlmAlertDescriptionDirective,
  HlmAlertTitleDirective,
  HlmAlertIconDirective,
} from '@spartan-ng/ui-alert-helm';
import {
  HlmH1Directive,
  HlmMutedDirective,
} from '@spartan-ng/ui-typography-helm';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-register',
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
    FormFieldComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private invitationService = inject(InvitationService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = this.auth.loading;
  errorMsg = signal('');
  private invitationToken: string | null = null;
  private redirectTo: string | null = null;

  constructor() {
    // Sync error signal from service
    effect(() => {
      this.errorMsg.set(this.auth.error() ?? '');
    });
  }

  ngOnInit() {
    this.invitationToken = this.route.snapshot.queryParamMap.get('invitation');
    this.redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
  }
  submit() {
    this.errorMsg.set('');
    if (this.form.invalid) {
      console.log('Form is invalid:', this.form.errors);
      console.log('Form values:', this.form.getRawValue());
      return;
    }
    const { username, email, password } = this.form.getRawValue();
    if (!username || !email || !password) {
      console.log('Missing required fields:', { username, email, password });
      return;
    }

    console.log('Register attempt with:', { username, email, password: '***' });
    this.auth.register({ username, email, password }).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        console.log('User authenticated:', this.auth.isAuthenticated());
        console.log('User data:', this.auth.user());

        toast.success('Account created successfully', {
          description:
            'Welcome! Your account has been created and you are now logged in.',
        });

        // Wait a bit for the state to update, then navigate
        setTimeout(() => {
          console.log('Navigation - Auth state:', {
            isAuthenticated: this.auth.isAuthenticated(),
            user: this.auth.user(),
          });

          // Redirect to the original URL if provided, otherwise to home
          const destination = this.redirectTo || '/';
          window.location.href = destination;
        }, 100);
      },
      error: (error) => {
        console.error('Registration failed:', error);

        // Provide specific error messages based on error status
        let errorMessage = 'Registration failed';
        let errorDescription = '';

        if (error.status === 400) {
          errorMessage = 'Invalid registration data';
          if (error.error?.message?.includes('email')) {
            errorDescription = 'This email address is already registered.';
          } else if (error.error?.message?.includes('username')) {
            errorDescription = 'This username is already taken.';
          } else {
            errorDescription =
              error.error?.message || 'Please check your input and try again.';
          }
        } else if (error.status === 409) {
          errorMessage = 'Account already exists';
          errorDescription =
            'An account with this email or username already exists.';
        } else if (error.status === 422) {
          errorMessage = 'Validation error';
          errorDescription =
            'Please check your input and ensure all fields are valid.';
        } else if (error.status === 0) {
          errorMessage = 'Connection error';
          errorDescription =
            'Unable to connect to the server. Please check your internet connection.';
        } else {
          errorDescription =
            error.error?.message ||
            'An unexpected error occurred during registration.';
        }

        toast.error(errorMessage, {
          description: errorDescription,
        });
      },
    });
  }
}
