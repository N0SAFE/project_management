import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TaskStatus, TaskPriority } from '../../../tasks/interfaces/task.model';

export interface ProjectSettingsData {
  statuses: TaskStatus[];
  priorities: TaskPriority[];
}

@Injectable({ providedIn: 'root' })
export class ProjectSettingsService {
  private apiUrl = `${environment.apiUrl}/projects`;
  private http = inject(HttpClient);

  // Get all project settings (statuses and priorities)
  getProjectSettings = async (projectId: number): Promise<ProjectSettingsData> => {
    const [statuses, priorities] = await Promise.all([
      this.getProjectStatuses(projectId),
      this.getProjectPriorities(projectId)
    ]);
    return { statuses, priorities };
  };

  // Task Status Methods
  getProjectStatuses = async (projectId: number): Promise<TaskStatus[]> => {
    const result = await this.http.get<TaskStatus[]>(`${this.apiUrl}/${projectId}/settings/statuses`).toPromise();
    if (!result) {
      throw new Error('Failed to load project statuses');
    }
    return result;
  };

  createTaskStatus = async (projectId: number, data: {
    name: string;
    description: string;
    color?: string;
    orderIndex?: number;
  }): Promise<TaskStatus> => {
    const result = await this.http.post<TaskStatus>(`${this.apiUrl}/${projectId}/settings/statuses`, data).toPromise();
    if (!result) {
      throw new Error('Failed to create task status');
    }
    return result;
  };

  updateTaskStatus = async (projectId: number, statusId: number, data: {
    name?: string;
    description?: string;
    color?: string;
    orderIndex?: number;
  }): Promise<TaskStatus> => {
    const result = await this.http.put<TaskStatus>(`${this.apiUrl}/${projectId}/settings/statuses/${statusId}`, data).toPromise();
    if (!result) {
      throw new Error('Failed to update task status');
    }
    return result;
  };

  deleteTaskStatus = async (projectId: number, statusId: number): Promise<void> => {
    await this.http.delete(`${this.apiUrl}/${projectId}/settings/statuses/${statusId}`).toPromise();
  };

  setDefaultTaskStatus = async (projectId: number, statusId: number): Promise<TaskStatus> => {
    const result = await this.http.post<TaskStatus>(`${this.apiUrl}/${projectId}/settings/statuses/${statusId}/set-default`, {}).toPromise();
    if (!result) {
      throw new Error('Failed to set default status');
    }
    return result;
  };

  // Task Priority Methods
  getProjectPriorities = async (projectId: number): Promise<TaskPriority[]> => {
    const result = await this.http.get<TaskPriority[]>(`${this.apiUrl}/${projectId}/settings/priorities`).toPromise();
    if (!result) {
      throw new Error('Failed to load project priorities');
    }
    return result;
  };

  createTaskPriority = async (projectId: number, data: {
    name: string;
    description: string;
    color?: string;
    level?: number;
    todoState?: string;
    doingState?: string;
    finishState?: string;
  }): Promise<TaskPriority> => {
    const result = await this.http.post<TaskPriority>(`${this.apiUrl}/${projectId}/settings/priorities`, data).toPromise();
    if (!result) {
      throw new Error('Failed to create task priority');
    }
    return result;
  };

  updateTaskPriority = async (projectId: number, priorityId: number, data: {
    name?: string;
    description?: string;
    color?: string;
    level?: number;
    todoState?: string;
    doingState?: string;
    finishState?: string;
  }): Promise<TaskPriority> => {
    const result = await this.http.put<TaskPriority>(`${this.apiUrl}/${projectId}/settings/priorities/${priorityId}`, data).toPromise();
    if (!result) {
      throw new Error('Failed to update task priority');
    }
    return result;
  };

  deleteTaskPriority = async (projectId: number, priorityId: number): Promise<void> => {
    await this.http.delete(`${this.apiUrl}/${projectId}/settings/priorities/${priorityId}`).toPromise();
  };

  setDefaultTaskPriority = async (projectId: number, priorityId: number): Promise<TaskPriority> => {
    const result = await this.http.post<TaskPriority>(`${this.apiUrl}/${projectId}/settings/priorities/${priorityId}/set-default`, {}).toPromise();
    if (!result) {
      throw new Error('Failed to set default priority');
    }
    return result;
  };
}
