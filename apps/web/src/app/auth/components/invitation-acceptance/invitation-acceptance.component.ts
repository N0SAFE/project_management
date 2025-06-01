import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InvitationService, InvitationDetails } from '../../services/invitation.service';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-invitation-acceptance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900">🚀 Invitation au projet</h2>
          <p class="mt-2 text-sm text-gray-600">
            Vous avez été invité(e) à rejoindre un projet
          </p>
        </div>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <!-- Loading State -->
          <div *ngIf="loading" class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-600">Vérification de l'invitation...</p>
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
              <p *ngIf="invitation.projectDescription" class="text-sm text-blue-700 mb-2">
                {{ invitation.projectDescription }}
              </p>
              <div class="text-sm text-blue-700">
                <p><strong>Invité(e) par :</strong> {{ invitation.inviterName }}</p>
                <p><strong>Votre rôle :</strong> {{ invitation.role }}</p>
                <p><strong>Email :</strong> {{ invitation.email }}</p>
              </div>
            </div>

            <!-- User already logged in -->
            <div *ngIf="isLoggedIn" class="space-y-4">
              <div class="bg-green-50 border border-green-200 rounded-md p-4">
                <p class="text-sm text-green-700">
                  Vous êtes connecté(e). Vous pouvez accepter cette invitation directement.
                </p>
              </div>
              <button
                (click)="acceptInvitation()"
                [disabled]="accepting"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <span *ngIf="accepting">Acceptation...</span>
                <span *ngIf="!accepting">Accepter l'invitation</span>
              </button>
            </div>

            <!-- User needs to login or register -->
            <div *ngIf="!isLoggedIn" class="space-y-4">
              <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p class="text-sm text-yellow-700">
                  Vous devez vous connecter ou créer un compte pour accepter cette invitation.
                </p>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <button
                  (click)="goToLogin()"
                  class="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Se connecter
                </button>
                <button
                  (click)="goToRegister()"
                  class="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Créer un compte
                </button>
              </div>
            </div>
          </div>

          <!-- Success State -->
          <div *ngIf="accepted" class="bg-green-50 border border-green-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">Invitation acceptée !</h3>
                <p class="mt-1 text-sm text-green-700">
                  You have successfully joined the project. Redirecting...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InvitationAcceptanceComponent implements OnInit {
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
      this.error = 'Invitation token is missing';
      this.loading = false;
      toast.error('Invalid Invitation', {
        description: 'The invitation link is missing the required token.'
      });
      return;
    }

    this.loadInvitationDetails();
  }

  async loadInvitationDetails() {
    if (!this.token) {
      return;
    }

    try {
      this.loading = true;
      this.invitation = await this.invitationService.getInvitationDetails(this.token);
      this.loading = false;
    } catch (error: any) {
      this.loading = false;
      let errorMessage = 'Failed to load invitation details';
      let errorDescription = 'An unexpected error occurred while loading the invitation.';
      
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 400:
            errorMessage = 'Invalid Invitation';
            errorDescription = 'The invitation token is invalid or malformed.';
            break;
          case 404:
            errorMessage = 'Invitation Not Found';
            errorDescription = 'This invitation does not exist or has expired.';
            break;
          case 410:
            errorMessage = 'Invitation Expired';
            errorDescription = 'This invitation has expired and can no longer be used.';
            break;
          case 0:
            errorMessage = 'Connection Error';
            errorDescription = 'Unable to connect to the server. Please check your internet connection.';
            break;
          default:
            errorDescription = error.error?.message || errorMessage;
        }
      } else {
        errorDescription = error?.message || errorMessage;
      }
      
      this.error = errorDescription;
      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }

  async acceptInvitation() {
    if (!this.token || !this.isLoggedIn) {
      toast.error('Cannot Accept Invitation', {
        description: 'You must be logged in to accept this invitation.'
      });
      return;
    }

    try {
      this.accepting = true;
      await this.invitationService.acceptInvitation(this.token);
      this.accepted = true;
      
      toast.success('Invitation Accepted Successfully', {
        description: 'You have successfully joined the project. Redirecting...'
      });
      
      // Redirect to project after success
      setTimeout(() => {
        this.router.navigate(['/projects']);
      }, 2000);
    } catch (error: any) {
      let errorMessage = 'Failed to Accept Invitation';
      let errorDescription = 'An unexpected error occurred while accepting the invitation.';
      
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 400:
            errorMessage = 'Invalid Invitation';
            errorDescription = 'The invitation is invalid or cannot be processed.';
            break;
          case 401:
            errorMessage = 'Authentication Required';
            errorDescription = 'You must be logged in to accept this invitation.';
            break;
          case 403:
            errorMessage = 'Access Denied';
            errorDescription = 'You do not have permission to accept this invitation.';
            break;
          case 404:
            errorMessage = 'Invitation Not Found';
            errorDescription = 'This invitation no longer exists or has been revoked.';
            break;
          case 409:
            errorMessage = 'Already a Member';
            errorDescription = 'You are already a member of this project.';
            break;
          case 410:
            errorMessage = 'Invitation Expired';
            errorDescription = 'This invitation has expired and can no longer be used.';
            break;
          case 0:
            errorMessage = 'Connection Error';
            errorDescription = 'Unable to connect to the server. Please check your internet connection.';
            break;
          default:
            errorDescription = error.error?.message || errorMessage;
        }
      } else {
        errorDescription = error?.message || errorMessage;
      }
      
      this.error = errorDescription;
      toast.error(errorMessage, {
        description: errorDescription
      });
    } finally {
      this.accepting = false;
    }
  }

  goToLogin() {
    const redirectUrl = `/invitation/${this.token}`;
    this.router.navigate(['/login'], { 
      queryParams: { redirectTo: redirectUrl }
    });
  }

  goToRegister() {
    this.router.navigate(['/register'], { 
      queryParams: { invitation: this.token }
    });
  }
}
