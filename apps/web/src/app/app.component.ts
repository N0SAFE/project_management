import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Project Management Tool';
  auth = inject(AuthService);
  router = inject(Router);
  user = this.auth.user;

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
