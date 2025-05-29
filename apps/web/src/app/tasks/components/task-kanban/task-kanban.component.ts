import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../services/task/task.service';
import { Task, TaskStatus } from '../../interfaces/task.model';
import { ProjectSettingsService } from '../../../projects/services/project-settings/project-settings.service';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmH1Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { HlmBreadcrumbDirective, HlmBreadcrumbItemDirective, HlmBreadcrumbLinkDirective, HlmBreadcrumbPageDirective, HlmBreadcrumbSeparatorComponent, HlmBreadcrumbListDirective } from '@spartan-ng/ui-breadcrumb-helm';
import { HlmAvatarImports } from '@spartan-ng/ui-avatar-helm';
import { HlmAlertDirective, HlmAlertDescriptionDirective, HlmAlertTitleDirective, HlmAlertIconDirective } from '@spartan-ng/ui-alert-helm';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';

interface KanbanColumn {
  id: number;
  status: TaskStatus;
  tasks: Task[];
}

@Component({
  selector: 'app-task-kanban',
  imports: [
    CommonModule,
    RouterLink,
    HlmCardDirective,
    HlmButtonDirective,
    HlmBadgeDirective,
    HlmH1Directive,
    HlmMutedDirective,
    HlmBreadcrumbDirective,
    HlmBreadcrumbItemDirective,
    HlmBreadcrumbLinkDirective,
    HlmBreadcrumbPageDirective,
    HlmBreadcrumbSeparatorComponent,
    HlmBreadcrumbListDirective,
    HlmAvatarImports,
    HlmAlertDirective,
    HlmAlertDescriptionDirective,
    HlmAlertTitleDirective,
    HlmAlertIconDirective,
    CdkDrag,
    CdkDropList
  ],
  templateUrl: './task-kanban.component.html',
  styleUrl: './task-kanban.component.scss'
})
export class TaskKanbanComponent {
  private taskService = inject(TaskService);
  private projectSettingsService = inject(ProjectSettingsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private queryClient = inject(QueryClient);
  
  projectId = Number(this.route.snapshot.paramMap.get('id'));
  errorMsg = signal('');

  // Query for tasks
  tasksQuery = injectQuery(() => ({
    queryKey: ['tasks', this.projectId],
    queryFn: () => this.taskService.fetchTasksByProject(this.projectId),
    enabled: !!this.projectId
  }));

  // Query for project statuses
  statusesQuery = injectQuery(() => ({
    queryKey: ['project-statuses', this.projectId],
    queryFn: () => this.projectSettingsService.getProjectStatuses(this.projectId),
    enabled: !!this.projectId
  }));

  // Mutation for updating task status
  updateTaskStatusMutation = injectMutation(() => ({
    mutationFn: ({ taskId, statusId }: { taskId: number, statusId: number }) => 
      this.taskService.updateTask(taskId, { statusId }),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['tasks', this.projectId] });
    },
    onError: (err: any) => {
      this.errorMsg.set(err?.message || 'Erreur lors de la mise à jour du statut');
    },
  }));

  // Computed kanban columns based on project statuses
  columns = computed(() => {
    const statuses = this.statusesQuery.data() || [];
    const tasks = this.tasksQuery.data() || [];
    
    return statuses
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(status => ({
        id: status.id,
        status,
        tasks: tasks.filter(task => task.status?.id === status.id)
      }));
  });

  // Handle drag and drop
  onTaskDropped(event: CdkDragDrop<Task[]>, targetStatusId: number) {
    if (event.previousContainer === event.container) {
      // Moving within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving between columns
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update task status in the backend
      this.updateTaskStatusMutation.mutate({
        taskId: task.id,
        statusId: targetStatusId
      });
    }
  }

  // Helper methods
  getPriorityColor(priority: any): string {
    if (priority && typeof priority === 'object' && priority.color) {
      return `bg-${priority.color}-100 text-${priority.color}-800 border-${priority.color}-300`;
    }
    // Fallback for legacy data
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getPriorityLabel(priority: any): string {
    if (priority && typeof priority === 'object' && priority.name) {
      return priority.name;
    }
    // Fallback for legacy data
    switch (priority) {
      case 'HIGH': return 'Élevée';
      case 'MEDIUM': return 'Moyenne'; 
      case 'LOW': return 'Faible';
      default: return priority || 'Non définie';
    }
  }

  getStatusIcon(status: TaskStatus): string {
    // Use status name as fallback identifier
    const statusName = status.name?.toLowerCase() || '';
    if (statusName.includes('todo') || statusName.includes('faire')) {
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    } else if (statusName.includes('progress') || statusName.includes('cours')) {
      return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
    } else if (statusName.includes('done') || statusName.includes('terminé')) {
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    }
    return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Default info icon
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  isOverdue(dateString: string): boolean {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }

  navigateToTask(taskId: number) {
    this.router.navigate(['/projects', this.projectId, 'tasks', taskId]);
  }

  editTask(taskId: number) {
    this.router.navigate(['/projects', this.projectId, 'tasks', taskId, 'edit']);
  }

  createNewTask() {
    this.router.navigate(['/projects', this.projectId, 'tasks', 'new']);
  }
}
