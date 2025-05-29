import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task } from '../../interfaces/task.model';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskService {
  apiUrl = 'http://localhost:8080/api/tasks';
  private http = inject(HttpClient);

  fetchTasksByProject = (projectId: number): Promise<Task[]> => {
    return lastValueFrom(this.http.get<Task[]>(`${this.apiUrl}/project/${projectId}`));
  };

  fetchTask = (id: number): Promise<Task> => {
    return lastValueFrom(this.http.get<Task>(`${this.apiUrl}/${id}`));
  };

  createTask = (data: any): Promise<Task> => {
    return lastValueFrom(this.http.post<Task>(this.apiUrl, data));
  };

  updateTask = (id: number, data: any): Promise<Task> => {
    return lastValueFrom(this.http.put<Task>(`${this.apiUrl}/${id}`, data));
  };

  updateTaskStatus = (id: number, statusId: number): Promise<Task> => {
    return lastValueFrom(this.http.put<Task>(`${this.apiUrl}/${id}`, { statusId }));
  };

  deleteTask = (id: number): Promise<void> => {
    return lastValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  };
}
