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
    FormFieldComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = this.auth.loading;
  errorMsg = signal('');

  constructor() {
    // Sync error signal from service
    effect(() => {
      this.errorMsg.set(this.auth.error() ?? '');
    });
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
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Registration failed:', error);
      }
    });
  }
}
