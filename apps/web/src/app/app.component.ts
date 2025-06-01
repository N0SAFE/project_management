import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { HlmAvatarFallbackDirective, HlmAvatarComponent } from '@spartan-ng/ui-avatar-helm';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterLink, 
    HlmButtonDirective, 
    HlmSeparatorDirective,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmToasterComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Project Management Tool';
  auth = inject(AuthService);
  router = inject(Router);
  user = this.auth.user;  logout() {
    this.auth.logout().subscribe({
      next: () => {
        toast.success('Logout successful', {
          description: 'You have been logged out successfully. See you soon!'
        });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        
        // Even if logout fails, we still navigate to login but show a warning
        toast.warning('Logout completed', {
          description: 'You have been logged out, but there was an issue clearing server session.'
        });
        
        this.router.navigate(['/login']);
      }
    });
  }
}
