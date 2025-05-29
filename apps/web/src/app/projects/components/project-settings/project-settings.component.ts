import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
  editingStatus: TaskStatus | null = null;
  editingPriority: TaskPriority | null = null;

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
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      this.closeStatusDialog();
    }
  }));

  updateStatusMutation = injectMutation(() => ({
    mutationFn: ({ statusId, data }: { statusId: number, data: any }) => 
      this.projectSettingsService.updateTaskStatus(this.id, statusId, data),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      this.closeStatusDialog();
    }
  }));

  deleteStatusMutation = injectMutation(() => ({
    mutationFn: (statusId: number) => this.projectSettingsService.deleteTaskStatus(this.id, statusId),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
    }
  }));

  setDefaultStatusMutation = injectMutation(() => ({
    mutationFn: (statusId: number) => this.projectSettingsService.setDefaultTaskStatus(this.id, statusId),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
    }
  }));

  createPriorityMutation = injectMutation(() => ({
    mutationFn: (data: any) => this.projectSettingsService.createTaskPriority(this.id, data),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      this.closePriorityDialog();
    }
  }));

  updatePriorityMutation = injectMutation(() => ({
    mutationFn: ({ priorityId, data }: { priorityId: number, data: any }) => 
      this.projectSettingsService.updateTaskPriority(this.id, priorityId, data),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
      this.closePriorityDialog();
    }
  }));

  deletePriorityMutation = injectMutation(() => ({
    mutationFn: (priorityId: number) => this.projectSettingsService.deleteTaskPriority(this.id, priorityId),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
    }
  }));

  setDefaultPriorityMutation = injectMutation(() => ({
    mutationFn: (priorityId: number) => this.projectSettingsService.setDefaultTaskPriority(this.id, priorityId),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'settings'] });
    }
  }));

  // Priority state options
  priorityStates = [
    { value: 'TODO', label: 'À faire', description: 'Tâches en attente' },
    { value: 'DOING', label: 'En cours', description: 'Tâches en développement' },
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
      alert('Impossible de supprimer le statut par défaut');
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
      alert('Impossible de supprimer la priorité par défaut');
      return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer la priorité "${priority.name}" ?`)) {
      this.deletePriorityMutation.mutate(priority.id);
    }
  }

  setDefaultPriority(priority: TaskPriority): void {
    this.setDefaultPriorityMutation.mutate(priority.id);
  }

  // Navigate back to project
  goBack(): void {
    this.router.navigate(['/projects', this.id]);
  }
}
