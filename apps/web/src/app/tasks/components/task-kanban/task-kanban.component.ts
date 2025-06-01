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
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray, transferArrayItem, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';

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
    CdkDropList,
    CdkDropListGroup
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

  // Mutation for updating task status with optimistic updates
  updateTaskStatusMutation = injectMutation(() => ({
    mutationFn: ({ taskId, statusId }: { taskId: number, statusId: number }) => 
      this.taskService.updateTaskStatus(taskId, statusId),
    onMutate: async ({ taskId, statusId }) => {
      console.log('Mutation starting for task:', taskId, 'to status:', statusId);
      
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await this.queryClient.cancelQueries({ queryKey: ['tasks', this.projectId] });
      
      // Snapshot the previous value
      const previousTasks = this.queryClient.getQueryData(['tasks', this.projectId]);
      
      // Get the target status object from the statuses query
      const statuses = this.statusesQuery.data() || [];
      const targetStatus = statuses.find(s => s.id === statusId);
      
      if (targetStatus) {
        // Optimistically update to the new value with complete status object
        this.queryClient.setQueryData(['tasks', this.projectId], (old: Task[] = []) => {
          return old.map(task => 
            task.id === taskId 
              ? { ...task, status: targetStatus }
              : task
          );
        });
        console.log('Optimistic update applied for task:', taskId, 'with status:', targetStatus.name);
      } else {
        console.warn('Target status not found:', statusId);
      }
      
      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      console.error('Mutation failed:', err);
      // If the mutation fails, use the context to roll back
      if (context?.previousTasks) {
        this.queryClient.setQueryData(['tasks', this.projectId], context.previousTasks);
      }
      
      // Get the status name for better error message
      const statuses = this.statusesQuery.data() || [];
      const targetStatus = statuses.find(s => s.id === variables.statusId);
      const statusName = targetStatus?.name || `Status ID ${variables.statusId}`;
      
      this.errorMsg.set(err?.message || 'Error updating task status');
      
      // Show error toast with specific details
      let errorMessage = 'Failed to update task status';
      let errorDescription = '';
      
      console.log(err)
      
      // if (err?.status === 400) {
      //   errorMessage = 'Invalid status update';
      //   errorDescription = `Unable to move task to "${statusName}". Please check if this status is valid.`;
      // } else if (err?.status === 403) {
      //   errorMessage = 'Permission denied';
      //   errorDescription = 'You do not have permission to update this task status.';
      // } else if (err?.status === 404) {
      //   errorMessage = 'Task or status not found';
      //   errorDescription = 'The task or target status could not be found. Please refresh the page.';
      // } else if (err?.status === 0) {
      //   errorMessage = 'Connection error';
      //   errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      // } else {
      //   errorDescription = err?.message || `Failed to move task to "${statusName}". Please try again.`;
      // }
      
      toast.error(errorMessage, {
        description: errorDescription
      });
      
      // Only invalidate on error to ensure we have fresh data
      this.queryClient.invalidateQueries({ queryKey: ['tasks', this.projectId] });
    },
    onSuccess: (data, variables) => {
      console.log('Mutation succeeded for task:', variables.taskId, 'data:', data);
      
      // Get the status name for success message
      const statuses = this.statusesQuery.data() || [];
      const targetStatus = statuses.find(s => s.id === variables.statusId);
      const statusName = targetStatus?.name || 'new status';
      const taskName = data?.name || 'Task';
      
      // Show success toast
      toast.success('Task status updated', {
        description: `"${taskName}" has been moved to "${statusName}".`
      });
      
      // Update the cache with the actual server response
      this.queryClient.setQueryData(['tasks', this.projectId], (old: Task[] = []) => {
        return old.map(task => 
          task.id === variables.taskId 
            ? data // Use the server response which should have the updated status
            : task
        );
      });
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
    console.log('Drag drop event:', {
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      targetStatusId,
      sameContainer: event.previousContainer === event.container,
      taskData: event.previousContainer.data[event.previousIndex]
    });

    if (event.previousContainer === event.container) {
      // Moving within the same column - just reorder
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      console.log('Moved within same column');
    } else {
      // Moving between columns
      const task = event.previousContainer.data[event.previousIndex];
      const currentStatusId = task.status?.id;
      
      console.log('Moving task between columns:', {
        taskName: task.name,
        fromStatus: currentStatusId,
        toStatus: targetStatusId,
        taskId: task.id
      });
      
      // Only update if the status is actually different
      if (currentStatusId !== targetStatusId) {
        // Clear any previous error messages
        this.errorMsg.set('');
        
        // DO NOT perform manual transferArrayItem here!
        // The optimistic update in the mutation will handle the UI change
        // This prevents the double-update that causes jumping
        
        // Update the task status in the backend - optimistic update will handle UI
        this.updateTaskStatusMutation.mutate({
          taskId: task.id,
          statusId: targetStatusId
        });
      } else {
        console.log('Task status is already the target status, no update needed');
        // Still perform the UI transfer since user expects the card to move
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      }
    }
  }

  // Helper methods
  getPriorityColor(priority: any): string {
    // Use CSS variables for consistent dark mode support
    if (priority && typeof priority === 'object' && priority.color) {
      return `badge-${priority.color}`;
    }
    // Fallback for legacy data - use CSS variables
    switch (priority) {
      case 'HIGH': return 'badge-red';
      case 'MEDIUM': return 'badge-yellow';
      case 'LOW': return 'badge-green';
      default: return 'badge-gray';
    }
  }

  getPriorityVariant(priority: any): 'default' | 'destructive' | 'outline' | 'secondary' {
    if (priority && typeof priority === 'object' && priority.name) {
      const priorityName = priority.name.toUpperCase();
      if (priorityName.includes('HIGH') || priorityName.includes('HAUTE') || priorityName.includes('ÉLEVÉ')) {
        return 'destructive';
      } else if (priorityName.includes('MEDIUM') || priorityName.includes('MOYENNE')) {
        return 'secondary';
      }
      return 'outline';
    }
    // Fallback for legacy data
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
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
