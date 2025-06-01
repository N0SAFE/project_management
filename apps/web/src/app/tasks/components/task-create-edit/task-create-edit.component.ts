import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../services/task/task.service';
import { Task } from '../../interfaces/task.model';
import { ProjectService, ProjectMember } from '../../../projects/services/project/project.service';
import { ProjectSettingsService } from '../../../projects/services/project-settings/project-settings.service';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmH1Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { HlmBreadcrumbDirective, HlmBreadcrumbItemDirective, HlmBreadcrumbLinkDirective, HlmBreadcrumbPageDirective, HlmBreadcrumbSeparatorComponent, HlmBreadcrumbListDirective } from '@spartan-ng/ui-breadcrumb-helm';
import { FormFieldComponent } from '../../../shared/form-field/form-field.component';
import { HlmDatePickerComponent } from '@spartan-ng/ui-datepicker-helm';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmCalendarModule } from "../../../../libs/ui/ui-calendar-helm/src/index";
import { HlmCalendarComponent } from "../../../../libs/ui/ui-calendar-helm/src/lib/hlm-calendar.component";
import { HlmAvatarImports } from '@spartan-ng/ui-avatar-helm';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-task-create-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink, // For non-breadcrumb navigation (cancel button)
    HlmCardDirective,
    HlmButtonDirective,
    HlmInputDirective,
    HlmH1Directive,
    HlmMutedDirective,
    HlmBreadcrumbDirective,
    HlmBreadcrumbItemDirective,
    HlmBreadcrumbLinkDirective,
    HlmBreadcrumbPageDirective,
    HlmBreadcrumbSeparatorComponent,
    HlmBreadcrumbListDirective,
    FormFieldComponent,
    HlmDatePickerComponent,
    HlmSelectImports,
    BrnSelectImports,
    HlmAvatarImports
],
  templateUrl: './task-create-edit.component.html',
  styleUrl: './task-create-edit.component.scss'
})
export class TaskCreateEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private projectSettingsService = inject(ProjectSettingsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  queryClient = inject(QueryClient);
  projectId = Number(this.route.snapshot.paramMap.get('id'));
  taskId = this.route.snapshot.paramMap.get('taskId') ? Number(this.route.snapshot.paramMap.get('taskId')) : null;
  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    dueDate: [new Date(), Validators.required],
    priorityId: ['', Validators.required],
    statusId: ['', Validators.required],
    assigneeId: ['']
  });
  date = new Date();

  constructor() {
    // Effect to populate form when task data is loaded
    effect(() => {
      const taskData = this.taskQuery.data();
      if (taskData && this.taskId) {
        this.populateForm(taskData);
      }
    });

    // Effect to set default values when project settings are loaded
    effect(() => {
      const statuses = this.statusesQuery.data();
      const priorities = this.prioritiesQuery.data();
      
      if (!this.taskId && statuses && priorities) {
        const defaultStatus = statuses.find(s => s.isDefault);
        const defaultPriority = priorities.find(p => p.isDefault);
        
        if (defaultStatus && !this.form.get('statusId')?.value) {
          this.form.patchValue({ statusId: defaultStatus.id.toString() });
        }
        if (defaultPriority && !this.form.get('priorityId')?.value) {
          this.form.patchValue({ priorityId: defaultPriority.id.toString() });
        }
      }
    });
  }

  // Query for project members
  projectMembersQuery = injectQuery(() => ({
    queryKey: ['projectMembers', this.projectId],
    queryFn: () => this.projectService.fetchProjectMembers(this.projectId),
    enabled: !!this.projectId
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

  // Query for fetching task data for editing
  taskQuery = injectQuery(() => ({
    queryKey: ['task', this.taskId],
    queryFn: () => this.taskService.fetchTask(this.taskId!),
    enabled: !!this.taskId
  }));

  ngOnInit() {
    // Form population is handled by the effect in constructor
    // This ensures reactive updates when task data is loaded
  }

  private populateForm(task: any) {
    this.form.patchValue({
      name: task.name,
      description: task.description,
      dueDate: new Date(task.dueDate),
      priorityId: task.priority?.id?.toString() || '',
      statusId: task.status?.id?.toString() || '',
      assigneeId: task.assignee?.id?.toString() || ''
    });
  }

  createTaskMutation = injectMutation(() => ({
    mutationFn: (data: any) => this.taskService.createTask(data),
    onSuccess: (task: any) => {
      this.queryClient.invalidateQueries({ queryKey: ['tasks', this.projectId] });
      toast.success('Task Created Successfully', {
        description: `Task "${task.name}" has been created and you have been redirected to it.`
      });
      this.router.navigate(['/projects', this.projectId, 'tasks', task.id]);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to Create Task';
      let errorDescription = 'An unexpected error occurred while creating the task.';

      if (error?.status === 400) {
        errorMessage = 'Invalid Task Data';
        errorDescription = 'Please check the task details and ensure all required fields are filled correctly.';
      } else if (error?.status === 403) {
        errorMessage = 'Access Denied';
        errorDescription = 'You do not have permission to create tasks in this project.';
      } else if (error?.status === 404) {
        errorMessage = 'Project Not Found';
        errorDescription = 'The project you are trying to create a task in no longer exists.';
      } else if (error?.status === 422) {
        errorMessage = 'Validation Error';
        errorDescription = error?.message || 'Please check your input and try again.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection Error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      }

      toast.error(errorMessage, {
        description: errorDescription
      });
    },
  }));

  updateTaskMutation = injectMutation(() => ({
    mutationFn: (data: any) => this.taskService.updateTask(this.taskId!, data),
    onSuccess: (task: any) => {
      this.queryClient.invalidateQueries({ queryKey: ['tasks', this.projectId] });
      toast.success('Task Updated Successfully', {
        description: `Task "${task.name}" has been successfully updated.`
      });
      this.router.navigate(['/projects', this.projectId, 'tasks', task.id]);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to Update Task';
      let errorDescription = 'An unexpected error occurred while updating the task.';

      if (error?.status === 400) {
        errorMessage = 'Invalid Task Data';
        errorDescription = 'Please check the task details and ensure all fields are valid.';
      } else if (error?.status === 403) {
        errorMessage = 'Access Denied';
        errorDescription = 'You do not have permission to update this task.';
      } else if (error?.status === 404) {
        errorMessage = 'Task Not Found';
        errorDescription = 'The task you are trying to update no longer exists.';
      } else if (error?.status === 409) {
        errorMessage = 'Conflict Error';
        errorDescription = 'The task has been modified by another user. Please refresh and try again.';
      } else if (error?.status === 422) {
        errorMessage = 'Validation Error';
        errorDescription = error?.message || 'Please check your input and try again.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection Error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      }

      toast.error(errorMessage, {
        description: errorDescription
      });
    },
  }));

  submit() {
    if (this.form.invalid) {
      toast.error('Invalid Form', {
        description: 'Please check all required fields before submitting.'
      });
      return;
    }
    
    // Format the data, ensuring dueDate is in the correct format for the API
    const formData = this.form.value;
    const data = { 
      name: formData.name,
      description: formData.description,
      projectId: this.projectId,
      // Convert Date object to YYYY-MM-DD format for LocalDate parsing
      dueDate: formData.dueDate instanceof Date 
        ? formData.dueDate.toISOString().split('T')[0] 
        : formData.dueDate,
      // Convert string IDs to numbers for the API
      priorityId: formData.priorityId ? Number(formData.priorityId) : null,
      statusId: formData.statusId ? Number(formData.statusId) : null,
      assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null
    };
    
    if (this.taskId) {
      this.updateTaskMutation.mutate(data);
    } else {
      this.createTaskMutation.mutate(data);
    }
  }

  // Helper method to get selected member name for display
  getSelectedMemberName(): string {
    const assigneeId = this.form.get('assigneeId')?.value;
    if (!assigneeId || this.projectMembersQuery.isPending()) {
      return 'Sélectionnez un membre';
    }
    
    const members = this.projectMembersQuery.data();
    const selectedMember = members?.find(member => member.user.id.toString() === assigneeId);
    return selectedMember ? selectedMember.user.username : 'Sélectionnez un membre';
  }

  // Helper method to get selected priority name for display
  getSelectedPriorityName(): string {
    const priorityId = this.form.get('priorityId')?.value;
    if (!priorityId || this.prioritiesQuery.isPending()) {
      return 'Sélectionnez une priorité';
    }
    
    const priorities = this.prioritiesQuery.data();
    const selectedPriority = priorities?.find(priority => priority.id.toString() === priorityId);
    return selectedPriority ? selectedPriority.name : 'Sélectionnez une priorité';
  }

  // Helper method to get selected status name for display
  getSelectedStatusName(): string {
    const statusId = this.form.get('statusId')?.value;
    if (!statusId || this.statusesQuery.isPending()) {
      return 'Sélectionnez un statut';
    }
    
    const statuses = this.statusesQuery.data();
    const selectedStatus = statuses?.find(status => status.id.toString() === statusId);
    return selectedStatus ? selectedStatus.name : 'Sélectionnez un statut';
  }

  // Helper method to get role badge color
  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MEMBER': return 'bg-blue-100 text-blue-800';
      case 'OBSERVER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Helper method to get status display text
  getStatusDisplay(status: string | null | undefined): string {
    if (!status) {
      return 'À faire - En attente';
    }
    
    switch (status) {
      case 'TODO': return 'À faire - En attente';
      case 'IN_PROGRESS': return 'In Progress - Under development';
      case 'REVIEW': return 'En révision - Attente validation';
      case 'DONE': return 'Terminé - Complété';
      default: return 'Sélectionnez un statut';
    }
  }
}
