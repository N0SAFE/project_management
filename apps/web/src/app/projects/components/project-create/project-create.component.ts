import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule],
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
