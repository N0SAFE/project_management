import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { HlmAvatarFallbackDirective, HlmAvatarComponent } from '@spartan-ng/ui-avatar-helm';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    HlmButtonDirective, 
    HlmSeparatorDirective,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Project Management Tool';
  auth = inject(AuthService);
  router = inject(Router);
  user = this.auth.user;
  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if logout fails, redirect to login
        this.router.navigate(['/login']);
      }
    });
  }
}
