import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService, ProjectMember } from '../../services/project/project.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';
import { HlmSkeletonComponent } from '@spartan-ng/ui-skeleton-helm';
import { HlmAvatarComponent, HlmAvatarFallbackDirective } from '@spartan-ng/ui-avatar-helm';
import { HlmAlertDirective, HlmAlertDescriptionDirective, HlmAlertTitleDirective, HlmAlertIconDirective } from '@spartan-ng/ui-alert-helm';
import { HlmH1Directive, HlmH3Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { FormFieldComponent } from '../../../shared/form-field/form-field.component';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { BrnSelectImports } from '@spartan-ng/brain/select';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RouterLink,
    HlmCardDirective, 
    HlmButtonDirective, 
    HlmInputDirective, 
    HlmBadgeDirective,
    HlmSkeletonComponent,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
    HlmAlertDirective,
    HlmAlertDescriptionDirective,
    HlmAlertTitleDirective,
    HlmAlertIconDirective,
    HlmH1Directive,
    HlmH3Directive,
    HlmMutedDirective,
    FormFieldComponent,
    HlmSelectImports,
    BrnSelectImports,
  ],
  templateUrl: './project-members.component.html',
  styleUrl: './project-members.component.scss'
})
export class ProjectMembersComponent {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private fb = inject(FormBuilder);
  private queryClient = inject(QueryClient)
  id = Number(this.route.snapshot.paramMap.get('id'));

  membersQuery = injectQuery(() => ({
    queryKey: ['project', this.id, 'members'],
    queryFn: () => this.projectService.fetchProjectMembers(this.id),
  }));

  inviteForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['MEMBER', Validators.required],
  });
  inviteError = signal('');

  inviteMutation = injectMutation(() => ({
    mutationFn: (data: { email: string; role: string }) =>
      this.projectService.inviteMember(this.id, data.email, data.role),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'members'] });
      this.inviteForm.reset({ role: 'MEMBER' });
    },
    onError: (err: any) => {
      this.inviteError.set(err?.message || "Erreur lors de l'invitation");
    },
  }));

  invite() {
    if (this.inviteForm.invalid) return;
    this.inviteError.set('');
    const { email, role } = this.inviteForm.value;
    this.inviteMutation.mutate({ email: email!, role: role! });
  }
}
