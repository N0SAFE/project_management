import { Component, signal, effect, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormFieldComponent } from '../../../shared/form-field/form-field.component';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { HlmAlertDirective, HlmAlertDescriptionDirective, HlmAlertTitleDirective, HlmAlertIconDirective } from '@spartan-ng/ui-alert-helm';
import { HlmH1Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';

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
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = this.auth.loading;
  errorMsg = signal('');

  constructor() {
    effect(() => {
      this.errorMsg.set(this.auth.error() ?? '');
    });
  }  submit() {
    this.errorMsg.set('');
    if (this.form.invalid) {
      return;
    }
    const { email, password } = this.form.getRawValue();
    if (!email || !password) {
      return;
    }
    
    console.log('Login attempt with:', { email });
      this.auth.login({ email, password }).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        console.log('User authenticated:', this.auth.isAuthenticated());
        console.log('User data:', this.auth.user());
        
        // Wait a bit for the state to update, then navigate
        setTimeout(() => {
          console.log('Navigation - Auth state:', {
            isAuthenticated: this.auth.isAuthenticated(),
            user: this.auth.user()
          });
          this.router.navigate(['/']);
        }, 100);
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMsg.set(error.error?.error || 'Login failed');
      }
    });
  }
}
