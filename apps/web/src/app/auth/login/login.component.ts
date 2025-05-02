import { Component, signal, effect, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
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
  }

  submit() {
    this.errorMsg.set('');
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    if (!email || !password) return;
    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      }
    });
  }
}
