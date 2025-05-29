export interface TaskStatus {
  id: number;
  name: string;
  description: string;
  color: string;
  orderIndex: number;
  isDefault: boolean;
  project: any;
}

export interface TaskPriority {
  id: number;
  name: string;
  description: string;
  color: string;
  level: number;
  todoState: 'TODO' | 'DOING' | 'FINISH';
  doingState: 'TODO' | 'DOING' | 'FINISH';
  finishState: 'TODO' | 'DOING' | 'FINISH';
  isDefault: boolean;
  project: any;
}

export interface Task {
  id: number;
  name: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  project: any;
  assignee: any;
}
