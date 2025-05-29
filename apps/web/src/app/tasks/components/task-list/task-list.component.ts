import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../services/task/task.service';
import { ProjectSettingsService } from '../../../projects/services/project-settings/project-settings.service';
import { TaskStatus, TaskPriority } from '../../interfaces/task.model';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import {
  HlmH1Directive,
  HlmH3Directive,
  HlmMutedDirective,
} from '@spartan-ng/ui-typography-helm';
import {
  HlmBreadcrumbDirective,
  HlmBreadcrumbItemDirective,
  HlmBreadcrumbLinkDirective,
  HlmBreadcrumbPageDirective,
  HlmBreadcrumbSeparatorComponent,
  HlmBreadcrumbListDirective,
} from '@spartan-ng/ui-breadcrumb-helm';
import {
  HlmProgressDirective,
  HlmProgressIndicatorDirective,
} from '@spartan-ng/ui-progress-helm';
import { DatePipe } from '@angular/common';
import {
  BrnProgressComponent,
  BrnProgressIndicatorComponent,
} from '@spartan-ng/brain/progress';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { BrnSelectImports } from '@spartan-ng/brain/select';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    HlmCardDirective,
    HlmButtonDirective,
    HlmInputDirective,
    HlmBadgeDirective,
    HlmSkeletonComponent,
    HlmSeparatorDirective,
    HlmH1Directive,
    HlmH3Directive,
    HlmMutedDirective,
    HlmBreadcrumbDirective,
    HlmBreadcrumbItemDirective,
    HlmBreadcrumbLinkDirective,
    HlmBreadcrumbPageDirective,
    HlmBreadcrumbSeparatorComponent,
    HlmBreadcrumbListDirective,
    HlmProgressDirective,
    FormsModule,
    DatePipe,
    HlmProgressIndicatorDirective,
    BrnProgressComponent,
    BrnProgressIndicatorComponent,
    RouterLink,
    BrnSelectImports,
    HlmSelectImports,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private projectSettingsService = inject(ProjectSettingsService);
  private router = inject(Router);
  projectId = Number(this.route.snapshot.paramMap.get('id'));

  tasksQuery = injectQuery(() => ({
    queryKey: ['tasks', this.projectId],
    queryFn: () => this.taskService.fetchTasksByProject(this.projectId),
  }));

  // Query for project statuses
  statusesQuery = injectQuery(() => ({
    queryKey: ['project-statuses', this.projectId],
    queryFn: () => this.projectSettingsService.getProjectStatuses(this.projectId),
    enabled: !!this.projectId
  }));

  // Query for project priorities
  prioritiesQuery = injectQuery(() => ({
    queryKey: ['project-priorities', this.projectId],
    queryFn: () => this.projectSettingsService.getProjectPriorities(this.projectId),
    enabled: !!this.projectId
  }));

  // Filtering state - now using IDs instead of strings
  filterStatus = signal<number | null>(null);
  filterPriority = signal<number | null>(null);
  filterAssignee = signal<string>('');

  filteredTasks = computed(() => {
    const tasks = this.tasksQuery.data() ?? [];
    return tasks.filter((task) => {
      const statusOk =
        !this.filterStatus() || task.status?.id === this.filterStatus();
      const priorityOk =
        !this.filterPriority() || task.priority?.id === this.filterPriority();
      const assigneeOk =
        !this.filterAssignee() ||
        (task.assignee && String(task.assignee.id) === this.filterAssignee());
      return statusOk && priorityOk && assigneeOk;
    });
  });

  goToTask(id: number) {
    this.router.navigate(['/projects', this.projectId, 'tasks', id]);
  }

  getTaskProgress(status: any): number {
    // Handle both legacy string format and new TaskStatus object format
    const statusName = typeof status === 'object' && status?.name ? status.name.toUpperCase() : 
                      typeof status === 'string' ? status.toUpperCase() : '';
    
    if (statusName.includes('TODO') || statusName.includes('FAIRE')) {
      return 0;
    } else if (statusName.includes('IN_PROGRESS') || statusName.includes('PROGRESS') || statusName.includes('COURS')) {
      return 50;
    } else if (statusName.includes('DONE') || statusName.includes('TERMINÉ') || statusName.includes('COMPLETE')) {
      return 100;
    }
    return 0;
  }

  // Helper methods for display
  getStatusLabel(status: any): string {
    if (status && typeof status === 'object' && status.name) {
      return status.name;
    }
    // Fallback for legacy data
    switch (status) {
      case 'TODO': return 'À faire';
      case 'IN_PROGRESS': return 'En cours';
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
