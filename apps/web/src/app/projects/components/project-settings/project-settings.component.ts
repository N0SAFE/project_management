import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';

// UI Components
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmFormFieldComponent } from '@spartan-ng/ui-formfield-helm';
import { HlmH1Directive, HlmH2Directive, HlmH3Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { HlmTabsComponent, HlmTabsContentDirective, HlmTabsListComponent, HlmTabsTriggerDirective } from '@spartan-ng/ui-tabs-helm';
import { HlmDialogComponent, HlmDialogContentComponent, HlmDialogDescriptionDirective, HlmDialogHeaderComponent, HlmDialogTitleDirective, HlmDialogFooterComponent } from '@spartan-ng/ui-dialog-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { HlmAlertDirective, HlmAlertDescriptionDirective, HlmAlertIconDirective, HlmAlertTitleDirective } from '@spartan-ng/ui-alert-helm';

// Services
import { ProjectService } from '../../services/project/project.service';
import { ProjectSettingsService, ProjectSettingsData } from '../../services/project-settings/project-settings.service';
import { AuthService } from '../../../auth/services/auth.service';
import { TaskStatus, TaskPriority } from '../../../tasks/interfaces/task.model';
import { BrnDialogContentDirective, BrnDialogTriggerDirective } from '@spartan-ng/brain/dialog';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    FormsModule,
    HlmCardDirective,
    HlmButtonDirective,
    HlmBadgeDirective,
    HlmSkeletonComponent,
    HlmInputDirective,
    HlmLabelDirective,
    HlmH1Directive,
    HlmH2Directive,
    HlmH3Directive,
    HlmMutedDirective,
    HlmTabsComponent,
    HlmTabsContentDirective,
    HlmTabsListComponent,
    HlmTabsTriggerDirective,
    BrnDialogContentDirective,

    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogHeaderComponent,
    HlmDialogFooterComponent,
    HlmDialogTitleDirective,
    HlmDialogDescriptionDirective,

    HlmLabelDirective,
    HlmInputDirective,
    HlmButtonDirective,

    HlmLabelDirective,
    HlmInputDirective,
    HlmButtonDirective,
    
    BrnSelectImports,
    HlmSelectImports,
    
    HlmAlertDirective,
    HlmAlertDescriptionDirective,
    HlmAlertIconDirective,
    HlmAlertTitleDirective
  ],
  templateUrl: './project-settings.component.html',
  styleUrl: './project-settings.component.scss'
})
export class ProjectSettingsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private projectSettingsService = inject(ProjectSettingsService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private queryClient = inject(QueryClient);

  id = Number(this.route.snapshot.paramMap.get('id'));
  
  // State
  activeTab = 'statuses';
  showStatusDialog = false;
  showPriorityDialog = false;
  showProjectEditDialog = false;
  showDeleteConfirmDialog = false;
  editingStatus: TaskStatus | null = null;
  editingPriority: TaskPriority | null = null;
  projectNameConfirmation = '';

  // Forms
  statusForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(255)]],
    color: ['#6B7280', [Validators.required]]
  });

  priorityForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(255)]],
    color: ['#6B7280', [Validators.required]],
    level: [1, [Validators.required, Validators.min(1)]],
    todoState: ['TODO', [Validators.required]],
    doingState: ['DOING', [Validators.required]],
    finishState: ['FINISH', [Validators.required]]
  });

  projectEditForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]]
  });

  // Queries
  projectQuery = injectQuery(() => ({
    queryKey: ['project', this.id],
    queryFn: () => this.projectService.fetchProject(this.id),
  }));

  settingsQuery = injectQuery(() => ({
    queryKey: ['project', this.id, 'settings'],
    queryFn: () => this.projectSettingsService.getProjectSettings(this.id),
  }));

  membersQuery = injectQuery(() => ({
    queryKey: ['project', this.id, 'members'],
    queryFn: () => this.projectService.fetchProjectMembers(this.id),
  }));

  // Mutations
  createStatusMutation = injectMutation(() => ({
    mutationFn: (data: any) => this.projectSettingsService.createTaskStatus(this.id, data),
    onSuccess: (data) => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      this.closeStatusDialog();
      
      toast.success('Status created successfully', {
        description: `"${data.name}" has been added to your project statuses.`
      });
    },
    onError: (error: any) => {
      console.error('Failed to create status:', error);
      
      let errorMessage = 'Failed to create status';
      let errorDescription = '';
      
      if (error?.status === 400) {
        errorMessage = 'Invalid status data';
        errorDescription = error?.error?.message || 'Please check your input and try again.';
      } else if (error?.status === 403) {
        errorMessage = 'Permission denied';
        errorDescription = 'You do not have permission to create statuses in this project.';
      } else if (error?.status === 409) {
        errorMessage = 'Status already exists';
        errorDescription = 'A status with this name already exists in the project.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      } else {
        errorDescription = error?.error?.message || 'An unexpected error occurred while creating the status.';
      }
      
      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  updateStatusMutation = injectMutation(() => ({
    mutationFn: ({ statusId, data }: { statusId: number, data: any }) => 
      this.projectSettingsService.updateTaskStatus(this.id, statusId, data),
    onSuccess: (data) => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      this.closeStatusDialog();
      
      toast.success('Status updated successfully', {
        description: `"${data.name}" has been updated.`
      });
    },
    onError: (error: any) => {
      console.error('Failed to update status:', error);
      
      let errorMessage = 'Failed to update status';
      let errorDescription = '';
      
      if (error?.status === 400) {
        errorMessage = 'Invalid status data';
        errorDescription = error?.error?.message || 'Please check your input and try again.';
      } else if (error?.status === 403) {
        errorMessage = 'Permission denied';
        errorDescription = 'You do not have permission to update statuses in this project.';
      } else if (error?.status === 404) {
        errorMessage = 'Status not found';
        errorDescription = 'The status you are trying to update no longer exists.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      } else {
        errorDescription = error?.error?.message || 'An unexpected error occurred while updating the status.';
      }
      
      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  deleteStatusMutation = injectMutation(() => ({
    mutationFn: (statusId: number) => this.projectSettingsService.deleteTaskStatus(this.id, statusId),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      
      toast.success('Status deleted successfully', {
        description: 'The status has been removed from your project.'
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete status:', error);
      
      let errorMessage = 'Failed to delete status';
      let errorDescription = '';
      
      if (error?.status === 400) {
        errorMessage = 'Cannot delete status';
        errorDescription = 'This status cannot be deleted because it is being used by existing tasks.';
      } else if (error?.status === 403) {
        errorMessage = 'Permission denied';
        errorDescription = 'You do not have permission to delete statuses in this project.';
      } else if (error?.status === 404) {
        errorMessage = 'Status not found';
        errorDescription = 'The status you are trying to delete no longer exists.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      } else {
        errorDescription = error?.error?.message || 'An unexpected error occurred while deleting the status.';
      }
      
      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  setDefaultStatusMutation = injectMutation(() => ({
    mutationFn: (statusId: number) => this.projectSettingsService.setDefaultTaskStatus(this.id, statusId),
    onSuccess: (data) => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      
      toast.success('Default status updated', {
        description: `"${data?.name || 'Selected status'}" is now the default status for new tasks.`
      });
    },
    onError: (error) => {
      console.error('Failed to set default status:', error);
      
      let errorMessage = 'Failed to set default status';
      let errorDescription = '';
      
      // if (error?.status === 403) {
      //   errorMessage = 'Permission denied';
      //   errorDescription = 'You do not have permission to change default settings in this project.';
      // } else if (error?.status === 404) {
      //   errorMessage = 'Status not found';
      //   errorDescription = 'The status you selected no longer exists.';
      // } else if (error?.status === 0) {
      //   errorMessage = 'Connection error';
      //   errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      // } else {
      //   errorDescription = error?.error?.message || 'An unexpected error occurred while setting the default status.';
      // }
      
      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  createPriorityMutation = injectMutation(() => ({
    mutationFn: (data: any) => this.projectSettingsService.createTaskPriority(this.id, data),
    onSuccess: (result: any) => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      this.closePriorityDialog();
      toast.success('Priority Created', {
        description: `Priority "${result.name}" has been successfully created.`
      });
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create priority';
      let errorDescription = 'An unexpected error occurred while creating the priority.';

      if (error?.status === 400) {
        errorMessage = 'Invalid Priority Data';
        errorDescription = 'Please check the priority name and color values.';
      } else if (error?.status === 403) {
        errorMessage = 'Access Denied';
        errorDescription = 'You do not have permission to create priorities in this project.';
      } else if (error?.status === 409) {
        errorMessage = 'Priority Already Exists';
        errorDescription = 'A priority with this name already exists in the project.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection Error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      }

      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  updatePriorityMutation = injectMutation(() => ({
    mutationFn: ({ priorityId, data }: { priorityId: number, data: any }) => 
      this.projectSettingsService.updateTaskPriority(this.id, priorityId, data),
    onSuccess: (result: any) => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      this.closePriorityDialog();
      toast.success('Priority Updated', {
        description: `Priority "${result.name}" has been successfully updated.`
      });
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update priority';
      let errorDescription = 'An unexpected error occurred while updating the priority.';

      if (error?.status === 400) {
        errorMessage = 'Invalid Priority Data';
        errorDescription = 'Please check the priority name and color values.';
      } else if (error?.status === 403) {
        errorMessage = 'Access Denied';
        errorDescription = 'You do not have permission to update priorities in this project.';
      } else if (error?.status === 404) {
        errorMessage = 'Priority Not Found';
        errorDescription = 'The priority you are trying to update no longer exists.';
      } else if (error?.status === 409) {
        errorMessage = 'Priority Name Conflict';
        errorDescription = 'Another priority with this name already exists in the project.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection Error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      }

      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  deletePriorityMutation = injectMutation(() => ({
    mutationFn: (priorityId: number) => this.projectSettingsService.deleteTaskPriority(this.id, priorityId),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      toast.success('Priority Deleted', {
        description: 'The priority has been successfully deleted from the project.'
      });
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to delete priority';
      let errorDescription = 'An unexpected error occurred while deleting the priority.';

      if (error?.status === 400) {
        errorMessage = 'Cannot Delete Priority';
        errorDescription = 'This priority is currently in use and cannot be deleted.';
      } else if (error?.status === 403) {
        errorMessage = 'Access Denied';
        errorDescription = 'You do not have permission to delete priorities in this project.';
      } else if (error?.status === 404) {
        errorMessage = 'Priority Not Found';
        errorDescription = 'The priority you are trying to delete no longer exists.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection Error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      }

      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  setDefaultPriorityMutation = injectMutation(() => ({
    mutationFn: (priorityId: number) => this.projectSettingsService.setDefaultTaskPriority(this.id, priorityId),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      toast.success('Default Priority Set', {
        description: 'The default task priority has been successfully updated.'
      });
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to set default priority';
      let errorDescription = 'An unexpected error occurred while setting the default priority.';

      if (error?.status === 400) {
        errorMessage = 'Invalid Priority';
        errorDescription = 'The selected priority cannot be set as default.';
      } else if (error?.status === 403) {
        errorMessage = 'Access Denied';
        errorDescription = 'You do not have permission to change default settings in this project.';
      } else if (error?.status === 404) {
        errorMessage = 'Priority Not Found';
        errorDescription = 'The priority you are trying to set as default no longer exists.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection Error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      }

      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  // Project management mutations
  updateProjectMutation = injectMutation(() => ({
    mutationFn: (data: { name: string; description: string }) => 
      this.projectService.updateProject(this.id, data),
    onSuccess: (updatedProject) => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id] });
      this.closeProjectEditDialog();
      toast.success('Project Updated', {
        description: `Project "${updatedProject.name}" has been successfully updated.`
      });
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update project';
      let errorDescription = 'An unexpected error occurred while updating the project.';

      if (error?.status === 400) {
        errorMessage = 'Invalid Project Data';
        errorDescription = 'Please check the project name and description.';
      } else if (error?.status === 403) {
        errorMessage = 'Access Denied';
        errorDescription = 'You do not have permission to update this project.';
      } else if (error?.status === 404) {
        errorMessage = 'Project Not Found';
        errorDescription = 'The project you are trying to update no longer exists.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection Error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      }

      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  deleteProjectMutation = injectMutation(() => ({
    mutationFn: () => {
      const project = this.projectQuery.data();
      return this.projectService.deleteProject(this.id, this.projectNameConfirmation);
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['projects'] });
      this.closeDeleteConfirmDialog();
      toast.success('Project Deleted', {
        description: 'The project has been successfully deleted.'
      });
      // Navigate back to projects list after successful deletion
      this.router.navigate(['/projects']);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to delete project';
      let errorDescription = 'An unexpected error occurred while deleting the project.';

      if (error?.status === 400) {
        errorMessage = 'Cannot Delete Project';
        errorDescription = 'This project cannot be deleted because it has active tasks or members.';
      } else if (error?.status === 403) {
        errorMessage = 'Access Denied';
        errorDescription = 'You do not have permission to delete this project.';
      } else if (error?.status === 404) {
        errorMessage = 'Project Not Found';
        errorDescription = 'The project you are trying to delete no longer exists.';
      } else if (error?.status === 0) {
        errorMessage = 'Connection Error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      }

      toast.error(errorMessage, {
        description: errorDescription
      });
    }
  }));

  // Priority state options
  priorityStates = [
    { value: 'TODO', label: 'À faire', description: 'Tâches en attente' },
    { value: 'DOING', label: 'In Progress', description: 'Tasks in development' },
    { value: 'FINISH', label: 'Terminé', description: 'Tâches complétées' }
  ];

  // Color palette for quick selection
  colorPalette = [
    '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
  ];

  // Check if user is admin
  get isAdmin(): boolean {
    const user = this.authService.user();
    const membersData = this.membersQuery.data();
    if (!user || !membersData) {
      return false;
    }
    
    const userMember = membersData.find((member: any) => member.user.id === user.id);
    return userMember?.role === 'ADMIN';
  }

  // Status management methods
  openCreateStatusDialog(): void {
    this.editingStatus = null;
    this.statusForm.reset({ color: '#6B7280' });
    this.showStatusDialog = true;
  }

  openEditStatusDialog(status: TaskStatus): void {
    this.editingStatus = status;
    this.statusForm.patchValue({
      name: status.name,
      description: status.description,
      color: status.color
    });
    this.showStatusDialog = true;
  }

  closeStatusDialog(): void {
    this.showStatusDialog = false;
    this.editingStatus = null;
    this.statusForm.reset();
  }

  submitStatus(): void {
    if (this.statusForm.valid) {
      const data = this.statusForm.value;
      
      if (this.editingStatus) {
        this.updateStatusMutation.mutate({ statusId: this.editingStatus.id, data });
      } else {
        this.createStatusMutation.mutate(data);
      }
    }
  }

  deleteStatus(status: TaskStatus): void {
    if (status.isDefault) {
      alert('Cannot delete default status');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer le statut "${status.name}" ?`)) {
      this.deleteStatusMutation.mutate(status.id);
    }
  }

  setDefaultStatus(status: TaskStatus): void {
    this.setDefaultStatusMutation.mutate(status.id);
  }

  // Priority management methods
  openCreatePriorityDialog(): void {
    this.editingPriority = null;
    this.priorityForm.reset({ 
      color: '#6B7280',
      level: 1,
      todoState: 'TODO',
      doingState: 'DOING',
      finishState: 'FINISH'
    });
    this.showPriorityDialog = true;
  }

  openEditPriorityDialog(priority: TaskPriority): void {
    this.editingPriority = priority;
    this.priorityForm.patchValue({
      name: priority.name,
      description: priority.description,
      color: priority.color,
      level: priority.level,
      todoState: priority.todoState,
      doingState: priority.doingState,
      finishState: priority.finishState
    });
    this.showPriorityDialog = true;
  }

  closePriorityDialog(): void {
    this.showPriorityDialog = false;
    this.editingPriority = null;
    this.priorityForm.reset();
  }

  submitPriority(): void {
    if (this.priorityForm.valid) {
      const data = this.priorityForm.value;
      
      if (this.editingPriority) {
        this.updatePriorityMutation.mutate({ priorityId: this.editingPriority.id, data });
      } else {
        this.createPriorityMutation.mutate(data);
      }
    }
  }

  deletePriority(priority: TaskPriority): void {
    if (priority.isDefault) {
      alert('Cannot delete default priority');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer la priorité "${priority.name}" ?`)) {
      this.deletePriorityMutation.mutate(priority.id);
    }
  }

  setDefaultPriority(priority: TaskPriority): void {
    this.setDefaultPriorityMutation.mutate(priority.id);
  }

  // Project management methods
  openEditProjectDialog(): void {
    const project = this.projectQuery.data();
    if (project) {
      this.projectEditForm.patchValue({
        name: project.name,
        description: project.description
      });
    }
    this.showProjectEditDialog = true;
    console.log(this.showProjectEditDialog)
  }

  closeProjectEditDialog(): void {
    this.showProjectEditDialog = false;
    this.projectEditForm.reset();
  }

  submitProjectEdit(): void {
    if (this.projectEditForm.valid) {
      const data = this.projectEditForm.value;
      this.updateProjectMutation.mutate(data);
    }
  }

  openDeleteConfirmDialog(): void {
    this.projectNameConfirmation = '';
    this.showDeleteConfirmDialog = true;
  }

  closeDeleteConfirmDialog(): void {
    this.showDeleteConfirmDialog = false;
    this.projectNameConfirmation = '';
  }

  confirmDeleteProject(): void {
    const project = this.projectQuery.data();
    if (project && this.projectNameConfirmation === project.name) {
      this.deleteProjectMutation.mutate();
    }
  }

  get canDeleteProject(): boolean {
    const project = this.projectQuery.data();
    return project ? this.projectNameConfirmation === project.name : false;
  }

  // Navigate back to project
  goBack(): void {
    this.router.navigate(['/projects', this.id]);
  }
}
