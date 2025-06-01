import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InvitationDetails {
  id: number;
  email: string;
  projectName: string;
  projectDescription?: string;
  role: string;
  inviterName: string;
  status: string;
  expiresAt: string;
}

export interface InvitationAcceptResponse {
  member: any;
  project: {
    id: number;
    name: string;
    description?: string;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  async getInvitationDetails(token: string): Promise<InvitationDetails> {
    try {
      return await firstValueFrom(
        this.http.get<InvitationDetails>(`${this.baseUrl}/api/invitations/details/${token}`)
      );
    } catch (error: any) {
      throw new Error(error.error?.message || 'Invitation non trouvée ou expirée');
    }
  }

  async acceptInvitation(token: string): Promise<InvitationAcceptResponse> {
    try {
      return await firstValueFrom(
        this.http.post<InvitationAcceptResponse>(`${this.baseUrl}/api/invitations/accept/${token}`, {})
      );
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error accepting invitation');
    }
  }
}
