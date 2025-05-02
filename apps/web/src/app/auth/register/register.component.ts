import { Component, signal, effect, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
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
    if (this.form.invalid) return;
    const { username, email, password } = this.form.getRawValue();
    if (!username || !email || !password) return;
    this.auth.register({ username, email, password }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
