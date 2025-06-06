import { Component, OnInit, inject, afterNextRender, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';
import { AuthService } from '../../services/auth.service';
import { InvitationService, InvitationDetails } from '../../services/invitation.service';

@Component({
  selector: 'app-invitation-accept',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./invitation-accept.component.scss'],
  templateUrl: './invitation-accept.component.html',
})
export class InvitationAcceptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private invitationService = inject(InvitationService);

  // Convert to signals for better SSR compatibility
  loading = signal(true);
  error = signal<string | null>(null);
  invitation = signal<InvitationDetails | null>(null);
  accepting = signal(false);
  accepted = signal(false);
  isLoggedIn = signal(false);
  private token: string | null = null;

  constructor() {
    // Use afterNextRender to ensure DOM is ready
    afterNextRender(() => {
      this.isLoggedIn.set(this.authService.isAuthenticated());
    });
  }

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token');
    
    console.log('Token extracted from URL:', this.token);
    console.log('Route params:', this.route.snapshot.paramMap);
    console.log('Full URL:', window.location.href);
    
    if (!this.token) {
      this.error.set('Invitation token missing');
      this.loading.set(false);
      // toast.error('Invalid invitation link', {
      //   description: 'The invitation link is missing required information.'
      // });
      return;
    }

    this.loadInvitationDetails();
  }

  async loadInvitationDetails() {
    try {
      console.log('Loading invitation details for token:', this.token);
      const details = await this.invitationService.getInvitationDetails(this.token!);
      console.log('Invitation details loaded successfully:', details);
      this.invitation.set(details);
      this.loading.set(false);
    } catch (error: any) {
      console.error('Error loading invitation details:', error);
      this.loading.set(false);
      
      if (error instanceof HttpErrorResponse) {
        console.log('HTTP Error Response:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
        switch (error.status) {
          case 400:
            this.error.set('Invalid invitation token');
            // toast.error('Invalid invitation', {
            //   description: 'The invitation token is invalid or malformed.'
            // });
            break;
          case 404:
            this.error.set('Invitation not found');
            // toast.error('Invitation not found', {
            //   description: 'This invitation does not exist or has been revoked.'
            // });
            break;
          case 410:
            this.error.set('Invitation has expired');
            // toast.error('Invitation expired', {
            //   description: 'This invitation has expired and is no longer valid.'
            // });
            break;
          case 0:
            this.error.set('Connection error');
            // toast.error('Connection error', {
            //   description: 'Unable to connect to the server. Please check your internet connection.'
            // });
            break;
          default:
            this.error.set('Failed to load invitation details');
            // toast.error('Error loading invitation', {
            //   description: 'An unexpected error occurred while loading the invitation details.'
            // });
        }
      } else {
        const errorMessage = error.message || 'Failed to load invitation details';
        console.log('Non-HTTP error:', errorMessage);
        this.error.set(errorMessage);
        // toast.error('Error loading invitation', {
        //   description: errorMessage
        // });
      }
    }
  }

  async acceptInvitation() {
    if (!this.token || !this.isLoggedIn()) {
      return;
    }

    this.accepting.set(true);
    try {
      const response = await this.invitationService.acceptInvitation(this.token);
      this.accepted.set(true);
      
      // toast.success('Invitation accepted successfully!', {
      //   description: `You are now a member of ${this.invitation()?.projectName || 'the project'}.`
      // });
      
      // Redirect to project after 2 seconds
      setTimeout(() => {
        if (response.project?.id) {
          this.router.navigate(['/projects', response.project.id]);
        } else {
          this.router.navigate(['/projects']);
        }
      }, 2000);
    } catch (error: any) {
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 400:
            this.error.set('Invalid invitation or request');
            // toast.error('Invalid invitation', {
            //   description: 'The invitation token is invalid or the request is malformed.'
            // });
            break;
          case 401:
            this.error.set('Authentication required');
            // toast.error('Authentication required', {
            //   description: 'Please log in to accept this invitation.'
            // });
            break;
          case 403:
            this.error.set('Access denied');
            // toast.error('Access denied', {
            //   description: 'You do not have permission to accept this invitation.'
            // });
            break;
          case 404:
            this.error.set('Invitation not found');
            // toast.error('Invitation not found', {
            //   description: 'This invitation does not exist or has been revoked.'
            // });
            break;
          case 409:
            this.error.set('Already a member');
            // toast.warning('Already a member', {
            //   description: 'You are already a member of this project.'
            // });
            break;
          case 410:
            this.error.set('Invitation has expired');
            // toast.error('Invitation expired', {
            //   description: 'This invitation has expired and can no longer be accepted.'
            // });
            break;
          case 0:
            this.error.set('Connection error');
            // toast.error('Connection error', {
            //   description: 'Unable to connect to the server. Please check your internet connection.'
            // });
            break;
          default:
            this.error.set('Failed to accept invitation');
            // toast.error('Error accepting invitation', {
            //   description: 'An unexpected error occurred while accepting the invitation.'
            // });
        }
      } else {
        const errorMessage = error.message || 'Failed to accept invitation';
        this.error.set(errorMessage);
        // toast.error('Error accepting invitation', {
        //   description: errorMessage
        // });
      }
    } finally {
      this.accepting.set(false);
    }
  }

  goToLogin() {
    const redirectUrl = `/invitations/accept/${this.token}`;
    this.router.navigate(['/login'], { 
      queryParams: { redirectTo: redirectUrl }
    });
  }
}