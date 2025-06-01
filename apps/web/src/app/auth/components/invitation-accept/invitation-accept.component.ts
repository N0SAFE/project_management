import { Component, OnInit, inject } from '@angular/core';
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
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">🚀 Project Invitation</h2>
          <p class="mt-2 text-sm text-gray-600">
            You have been invited to join a project
          </p>
        </div>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <!-- Loading State -->
          <div *ngIf="loading" class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-600">Checking invitation...</p>
          </div>

          <!-- Error State -->
          <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Error</h3>
                <p class="mt-1 text-sm text-red-700">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Invitation Details -->
          <div *ngIf="invitation && !loading && !error">
            <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 class="text-lg font-medium text-blue-900 mb-2">{{ invitation.projectName }}</h3>
              <p class="text-sm text-blue-700 mb-2">{{ invitation.projectDescription }}</p>
              <p class="text-sm text-blue-600">
                <strong>Role:</strong> {{ invitation.role }}
              </p>
              <p class="text-sm text-blue-600">
                <strong>Invited by:</strong> {{ invitation.inviterName }}
              </p>
            </div>

            <!-- Not logged in - need to login -->
            <div *ngIf="!isLoggedIn" class="space-y-4">
              <p class="text-sm text-gray-600 text-center">
                You must log in to accept this invitation
              </p>
              <div class="space-y-3">
                <button 
                  (click)="goToLogin()"
                  class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Log in
                </button>
              </div>
            </div>

            <!-- Logged in - can accept -->
            <div *ngIf="isLoggedIn && !accepted" class="space-y-4">
              <button 
                (click)="acceptInvitation()"
                [disabled]="accepting"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <span *ngIf="accepting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                {{ accepting ? 'Accepting...' : 'Accept invitation' }}
              </button>
            </div>

            <!-- Success -->
            <div *ngIf="accepted" class="bg-green-50 border border-green-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-green-800">Invitation accepted!</h3>
                  <p class="mt-1 text-sm text-green-700">
                    You are now a member of the project. You will be redirected...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InvitationAcceptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private invitationService = inject(InvitationService);

  loading = true;
  error: string | null = null;
  invitation: InvitationDetails | null = null;
  accepting = false;
  accepted = false;
  isLoggedIn = false;
  private token: string | null = null;

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token');
    this.isLoggedIn = this.authService.isAuthenticated();
    
    if (!this.token) {
      this.error = 'Invitation token missing';
      this.loading = false;
      toast.error('Invalid invitation link', {
        description: 'The invitation link is missing required information.'
      });
      return;
    }

    this.loadInvitationDetails();
  }

  async loadInvitationDetails() {
    try {
      this.invitation = await this.invitationService.getInvitationDetails(this.token!);
      this.loading = false;
    } catch (error: any) {
      this.loading = false;
      
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 400:
            this.error = 'Invalid invitation token';
            toast.error('Invalid invitation', {
              description: 'The invitation token is invalid or malformed.'
            });
            break;
          case 404:
            this.error = 'Invitation not found';
            toast.error('Invitation not found', {
              description: 'This invitation does not exist or has been revoked.'
            });
            break;
          case 410:
            this.error = 'Invitation has expired';
            toast.error('Invitation expired', {
              description: 'This invitation has expired and is no longer valid.'
            });
            break;
          case 0:
            this.error = 'Connection error';
            toast.error('Connection error', {
              description: 'Unable to connect to the server. Please check your internet connection.'
            });
            break;
          default:
            this.error = 'Failed to load invitation details';
            toast.error('Error loading invitation', {
              description: 'An unexpected error occurred while loading the invitation details.'
            });
        }
      } else {
        this.error = error.message || 'Failed to load invitation details';
        toast.error('Error loading invitation', {
          description: this.error || 'An unknown error occurred'
        });
      }
    }
  }

  async acceptInvitation() {
    if (!this.token || !this.isLoggedIn) {
      return;
    }

    this.accepting = true;
    try {
      const response = await this.invitationService.acceptInvitation(this.token);
      this.accepted = true;
      
      toast.success('Invitation accepted successfully!', {
        description: `You are now a member of ${this.invitation?.projectName || 'the project'}.`
      });
      
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
            this.error = 'Invalid invitation or request';
            toast.error('Invalid invitation', {
              description: 'The invitation token is invalid or the request is malformed.'
            });
            break;
          case 401:
            this.error = 'Authentication required';
            toast.error('Authentication required', {
              description: 'Please log in to accept this invitation.'
            });
            break;
          case 403:
            this.error = 'Access denied';
            toast.error('Access denied', {
              description: 'You do not have permission to accept this invitation.'
            });
            break;
          case 404:
            this.error = 'Invitation not found';
            toast.error('Invitation not found', {
              description: 'This invitation does not exist or has been revoked.'
            });
            break;
          case 409:
            this.error = 'Already a member';
            toast.warning('Already a member', {
              description: 'You are already a member of this project.'
            });
            break;
          case 410:
            this.error = 'Invitation has expired';
            toast.error('Invitation expired', {
              description: 'This invitation has expired and can no longer be accepted.'
            });
            break;
          case 0:
            this.error = 'Connection error';
            toast.error('Connection error', {
              description: 'Unable to connect to the server. Please check your internet connection.'
            });
            break;
          default:
            this.error = 'Failed to accept invitation';
            toast.error('Error accepting invitation', {
              description: 'An unexpected error occurred while accepting the invitation.'
            });
        }
      } else {
        this.error = error.message || 'Failed to accept invitation';
        toast.error('Error accepting invitation', {
          description: this.error || 'An unknown error occurred'
        });
      }
    } finally {
      this.accepting = false;
    }
  }

  goToLogin() {
    const redirectUrl = `/invitations/accept/${this.token}`;
    this.router.navigate(['/login'], { 
      queryParams: { redirectTo: redirectUrl }
    });
  }
}