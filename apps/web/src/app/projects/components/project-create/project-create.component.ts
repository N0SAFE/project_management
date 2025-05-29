import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project/project.service';
import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmAlertDirective, HlmAlertDescriptionDirective, HlmAlertTitleDirective, HlmAlertIconDirective } from '@spartan-ng/ui-alert-helm';
import { HlmH1Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { FormFieldComponent } from '../../../shared/form-field/form-field.component';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RouterLink,
    HlmCardDirective, 
    HlmButtonDirective, 
    HlmInputDirective, 
    HlmAlertDirective,
    HlmAlertDescriptionDirective,
    HlmAlertTitleDirective,
    HlmAlertIconDirective,
    HlmH1Directive,
    HlmMutedDirective,
    FormFieldComponent
  ],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss'
})
export class ProjectCreateComponent {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    startDate: ['', [Validators.required]]
  });
  errorMsg = signal('');
  queryClient = inject(QueryClient)

  createProjectMutation = injectMutation(() => ({
    mutationFn: (data: { name: string; description: string; startDate: string }) =>
      this.projectService.createProject(data),
    onSuccess: (project) => {
      this.queryClient.invalidateQueries({ queryKey: ['projects'] });
      this.router.navigate(['/projects', project.id]);
    },
    onError: (err: any) => {
      this.errorMsg.set(err?.message || 'Erreur lors de la création du projet');
    },
  }));

  submit() {
    this.errorMsg.set('');
    if (this.form.invalid) return;
    const { name, description, startDate } = this.form.value;
    if (!name || !description || !startDate) {
      this.errorMsg.set('Tous les champs sont requis');
      return;
    }
    this.createProjectMutation.mutate({ name, description, startDate });
  }
}
