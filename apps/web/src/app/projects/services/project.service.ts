import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
}

export interface ProjectMember {
  id: number;
  user: any;
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER';
}

@Injectable({ providedIn: 'root' })

export class ProjectService {
  apiUrl = 'http://localhost:8080/api/projects';
  private http = inject(HttpClient);
  // TanStack Query fetchers and mutations
  fetchProjects = async (): Promise<Project[]> => {
    const result = await this.http.get<Project[]>(this.apiUrl).toPromise();
    if (!result) {
      throw new Error('No projects found');
    }
    return result;
  };

  fetchProject = async (id: number): Promise<Project> => {
    const result = await this.http.get<Project>(`${this.apiUrl}/${id}`).toPromise();
    if (!result) {
      throw new Error('Project not found');
    }
    return result;
  };

  fetchProjectMembers = async (id: number): Promise<ProjectMember[]> => {
    const result = await this.http.get<ProjectMember[]>(`${this.apiUrl}/${id}/members`).toPromise();
    if (!result) {
      throw new Error('No members found');
    }
    return result;
  };

  createProject = async (data: { name: string; description: string; startDate: string }): Promise<Project> => {
    const result = await this.http.post<Project>(this.apiUrl, data).toPromise();
    if (!result) {
      throw new Error('Project creation failed');
    }
    return result;
  };

  inviteMember = async (id: number, email: string, role: string): Promise<ProjectMember> => {
    const result = await this.http.post<ProjectMember>(`${this.apiUrl}/${id}/invite`, { email, role }).toPromise();
    if (!result) {
      throw new Error('Invitation failed');
    }
    return result;
  };

  changeMemberRole = async (id: number, userId: number, role: string): Promise<ProjectMember> => {
    const result = await this.http.post<ProjectMember>(`${this.apiUrl}/${id}/members/${userId}/role`, { role }).toPromise();
    if (!result) {
      throw new Error('Role change failed');
    }
    return result;
  };
}
