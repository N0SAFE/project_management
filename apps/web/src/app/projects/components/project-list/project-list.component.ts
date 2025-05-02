import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService, Project } from '../../services/project.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { injectQuery } from '@tanstack/angular-query-experimental';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent {
  private projectService = inject(ProjectService);
  private router = inject(Router);

  projectsQuery = injectQuery(() => ({
    queryKey: ['projects'],
    queryFn: () => this.projectService.fetchProjects(),
  }));

  goToProject(id: number) {
    this.router.navigate(['/projects', id]);
  }
}
