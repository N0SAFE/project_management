import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project/project.service';
import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmH1Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { FormFieldComponent } from '../../../shared/form-field/form-field.component';
import { HlmDatePickerComponent } from '@spartan-ng/ui-datepicker-helm';
import { toast } from 'ngx-sonner';

type CreateProjectFormGroupType = {
  name: string;
  description: string;
  startDate: Date | null;
};

@Component({
  selector: 'app-project-create',
  standalone: true,  imports: [
    ReactiveFormsModule, 
    RouterLink,
    HlmCardDirective, 
    HlmButtonDirective, 
    HlmInputDirective, 
    HlmH1Directive,
    HlmMutedDirective,
    FormFieldComponent,
    HlmDatePickerComponent
  ],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.scss'
})
export class ProjectCreateComponent {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private router = inject(Router);  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    startDate: this.fb.control<null | Date>(null, [Validators.nullValidator])
  });
  queryClient = inject(QueryClient)
  createProjectMutation = injectMutation(() => ({
    mutationFn: (data: { name: string; description: string; startDate: string }) =>
      this.projectService.createProject(data),
    onSuccess: (project) => {
      this.queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project Created Successfully', {
        description: `Project "${project.name}" has been created and you have been redirected to it.`
      });
      this.router.navigate(['/projects', project.id]);
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to Create Project';
      let errorDescription = 'An unexpected error occurred while creating the project.';

      if (error?.status === 400) {
        errorMessage = 'Invalid Project Data';
        errorDescription = 'Please check the project name, description, and start date.';
      } else if (error?.status === 403) {
        errorMessage = 'Access Denied';
        errorDescription = 'You do not have permission to create projects.';
      } else if (error?.status === 409) {
        errorMessage = 'Project Already Exists';
        errorDescription = 'A project with this name already exists.';
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
    const { name, description, startDate } = this.form.value;
    if (!name || !description || !startDate) {
      toast.error('Missing Fields', {
        description: 'All fields are required to create a project.'
      });
      return;
    }
    console.log('Submitting project creation:', { name, description, startDate });
    this.createProjectMutation.mutate({
      name,
      description,
      startDate: startDate.toISOString().split('T')[0]
    });
  }
}
