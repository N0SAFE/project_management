import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService, Project, ProjectMember } from '../../services/project.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { injectQuery } from '@tanstack/angular-query-experimental';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  id = Number(this.route.snapshot.paramMap.get('id'));

  projectQuery = injectQuery(() => ({
    queryKey: ['project', this.id],
    queryFn: () => this.projectService.fetchProject(this.id),
  }));

  membersQuery = injectQuery(() => ({
    queryKey: ['project', this.id, 'members'],
    queryFn: () => this.projectService.fetchProjectMembers(this.id),
  }));
}
