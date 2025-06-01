import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TaskService } from '../../services/task/task.service';
import { ProjectSettingsService } from '../../../projects/services/project-settings/project-settings.service';
import { TaskHistoryService } from '../../services/task-history/task-history.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { HlmH1Directive, HlmH3Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { DatePipe } from '@angular/common';
import { TaskHistoryComponent } from '../task-history/task-history.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    HlmCardDirective, 
    HlmButtonDirective, 
    HlmBadgeDirective,
    HlmSkeletonComponent,
    HlmSeparatorDirective,
    HlmH1Directive,
    HlmH3Directive,
    HlmMutedDirective,
    RouterModule,
    DatePipe,
    TaskHistoryComponent
  ],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private projectSettingsService = inject(ProjectSettingsService);
  projectId = Number(this.route.snapshot.paramMap.get('id'));
  taskId = Number(this.route.snapshot.paramMap.get('taskId'));

  taskQuery = injectQuery(() => ({
    queryKey: ['task', this.taskId],
    queryFn: () => this.taskService.fetchTask(this.taskId),
  }));

  // Helper methods for display
  getStatusLabel(status: any): string {
    if (status && typeof status === 'object' && status.name) {
      return status.name;
    }
    // Fallback for legacy data
    switch (status) {
      case 'TODO': return 'À faire';
      case 'IN_PROGRESS': return 'In Progress';
      case 'DONE': return 'Terminé';
      default: return status || 'Non défini';
    }
  }

  getPriorityLabel(priority: any): string {
    if (priority && typeof priority === 'object' && priority.name) {
      return priority.name;
    }
    // Fallback for legacy data
    switch (priority) {
      case 'LOW': return 'Basse';
      case 'MEDIUM': return 'Moyenne';
      case 'HIGH': return 'Haute';
      default: return priority || 'Non définie';
    }
  }

  getStatusVariant(status: any): 'default' | 'destructive' | 'outline' | 'secondary' {
    const statusName = typeof status === 'object' && status?.name ? status.name.toUpperCase() : 
                      typeof status === 'string' ? status.toUpperCase() : '';
    
    if (statusName.includes('DONE') || statusName.includes('TERMINÉ') || statusName.includes('COMPLETE')) {
      return 'default';
    } else if (statusName.includes('IN_PROGRESS') || statusName.includes('PROGRESS') || statusName.includes('COURS')) {
      return 'secondary';
    }
    return 'outline';
  }

  getPriorityVariant(priority: any): 'default' | 'destructive' | 'outline' | 'secondary' {
    const priorityName = typeof priority === 'object' && priority?.name ? priority.name.toUpperCase() : 
                        typeof priority === 'string' ? priority.toUpperCase() : '';
    
    if (priorityName.includes('HIGH') || priorityName.includes('HAUTE') || priorityName.includes('ÉLEVÉ')) {
      return 'destructive';
    } else if (priorityName.includes('MEDIUM') || priorityName.includes('MOYENNE')) {
      return 'secondary';
    }
    return 'outline';
  }
}
