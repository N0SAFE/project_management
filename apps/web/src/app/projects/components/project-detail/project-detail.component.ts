import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectService, Project, ProjectMember } from '../../services/project/project.service';
import { AuthService } from '../../../auth/services/auth.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { HlmH1Directive, HlmH3Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { DatePipe } from '@angular/common';
import { computed } from '@angular/core';
import { TaskHistoryComponent } from '../../../tasks/components/task-history/task-history.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterModule, 
    DatePipe,
    HlmCardDirective, 
    HlmButtonDirective, 
    HlmBadgeDirective,
    HlmSkeletonComponent,
    HlmSeparatorDirective,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmH1Directive,
    HlmH3Directive,
    HlmMutedDirective,
    TaskHistoryComponent
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  id = Number(this.route.snapshot.paramMap.get('id'));

  projectQuery = injectQuery(() => ({
    queryKey: ['project', this.id],
    queryFn: () => this.projectService.fetchProject(this.id),
  }));

  membersQuery = injectQuery(() => ({
    queryKey: ['project', this.id, 'members'],
    queryFn: () => this.projectService.fetchProjectMembers(this.id),
  }));

  // Check if current user is admin for this project
  isProjectAdmin = computed(() => {
    const currentUser = this.authService.user();
    const members = this.membersQuery.data();
    if (!currentUser || !members) return false;
    
    const userMember = members.find(member => member.user.id === currentUser.id);
    return userMember?.role === 'ADMIN';
  });
}
