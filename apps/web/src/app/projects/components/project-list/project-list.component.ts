import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProjectService, Project } from '../../services/project/project.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { HlmH1Directive, HlmH3Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    HlmCardDirective, 
    HlmButtonDirective, 
    HlmBadgeDirective, 
    HlmSeparatorDirective,
    HlmSkeletonComponent,
    HlmH1Directive,
    HlmH3Directive,
    HlmMutedDirective
  ],
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
