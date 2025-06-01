import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface TaskHistory {
  id: number;
  task: {
    id: number;
    name: string;
  };
  modifiedBy: {
    id: number;
    username: string;
    email: string;
  };
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'UNASSIGN' | 'STATUS_CHANGE' | 'PRIORITY_CHANGE';
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  comment: string | null;
}

export interface TaskHistoryPage {
  content: TaskHistory[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaskHistoryService {
  private apiUrl = 'http://localhost:8080/api';
  private http = inject(HttpClient);

  /**
   * Get history for a specific task
   * @param taskId - The ID of the task
   * @param page - Page number (0-based)
   * @param size - Number of items per page
   */
  getTaskHistory = (taskId: number, page: number = 0, size: number = 20): Promise<TaskHistoryPage> => {
    const params = { page: page.toString(), size: size.toString() };
    return lastValueFrom(
      this.http.get<TaskHistoryPage>(`${this.apiUrl}/tasks/${taskId}/history`, { params })
    );
  };

  /**
   * Get all history for a specific task (no pagination)
   * @param taskId - The ID of the task
   */
  getAllTaskHistory = (taskId: number): Promise<TaskHistory[]> => {
    const params = { size: '0' }; // size=0 means no pagination
    return lastValueFrom(
      this.http.get<TaskHistory[]>(`${this.apiUrl}/tasks/${taskId}/history`, { params })
    );
  };

  /**
   * Get project-wide task history
   * @param projectId - The ID of the project
   * @param page - Page number (0-based)
   * @param size - Number of items per page
   */
  getProjectTaskHistory = (projectId: number, page: number = 0, size: number = 50): Promise<TaskHistoryPage> => {
    const params = { page: page.toString(), size: size.toString() };
    return lastValueFrom(
      this.http.get<TaskHistoryPage>(`${this.apiUrl}/projects/${projectId}/tasks/history`, { params })
    );
  };

  /**
   * Get recent project activity (last 50 entries)
   * @param projectId - The ID of the project
   */
  getRecentProjectActivity = (projectId: number): Promise<TaskHistory[]> => {
    return lastValueFrom(
      this.http.get<TaskHistory[]>(`${this.apiUrl}/projects/${projectId}/activity`)
    );
  };

  /**
   * Format action for display
   */
  formatAction(action: TaskHistory['action']): string {
    const actionMap = {
      'CREATE': 'Created',
      'UPDATE': 'Updated',
      'DELETE': 'Deleted',
      'ASSIGN': 'Assigned',
      'UNASSIGN': 'Unassigned',
      'STATUS_CHANGE': 'Status Changed',
      'PRIORITY_CHANGE': 'Priority Changed'
    };
    return actionMap[action] || action;
  }

  /**
   * Format field name for display
   */
  formatFieldName(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      'name': 'Name',
      'description': 'Description',
      'dueDate': 'Due Date',
      'assignee': 'Assignee',
      'status': 'Status',
      'priority': 'Priority',
      'task': 'Task'
    };
    return fieldMap[fieldName] || fieldName;
  }

  /**
   * Get a summary of the change for display
   */
  getChangeSummary(historyItem: TaskHistory): string {
    const action = this.formatAction(historyItem.action);
    const field = this.formatFieldName(historyItem.fieldName);
    
    if (historyItem.action === 'CREATE') {
      return `${action} task`;
    }
    
    if (historyItem.action === 'DELETE') {
      return `${action} task`;
    }
    
    if (historyItem.action === 'ASSIGN' || historyItem.action === 'UNASSIGN') {
      return `${action} ${historyItem.newValue || 'task'}`;
    }
    
    if (historyItem.oldValue && historyItem.newValue) {
      return `${action} ${field} from "${historyItem.oldValue}" to "${historyItem.newValue}"`;
    }
    
    if (historyItem.newValue) {
      return `${action} ${field} to "${historyItem.newValue}"`;
    }
    
    if (historyItem.oldValue) {
      return `${action} ${field} from "${historyItem.oldValue}"`;
    }
    
    return `${action} ${field}`;
  }
}
