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
      console.log('Making API call to get invitation details for token:', token);
      console.log('API URL:', `${this.baseUrl}/invitations/details/${token}`);
      
      const response = await firstValueFrom(
        this.http.get<InvitationDetails>(`${this.baseUrl}/invitations/details/${token}`)
      );
      
      console.log('API response received:', response);
      return response;
    } catch (error: any) {
      console.error('API call failed:', error);
      
      if (error.error?.error) {
        throw new Error(error.error.error);
      } else if (error.error?.message) {
        throw new Error(error.error.message);
      } else {
        throw error;
      }
    }
  }

  async acceptInvitation(token: string): Promise<InvitationAcceptResponse> {
    try {
      return await firstValueFrom(
        this.http.post<InvitationAcceptResponse>(`${this.baseUrl}/invitations/accept/${token}`, {})
      );
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error accepting invitation');
    }
  }
}
