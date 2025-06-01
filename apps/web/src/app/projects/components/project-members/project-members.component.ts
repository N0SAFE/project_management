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
import { HlmH1Directive, HlmH3Directive, HlmMutedDirective } from '@spartan-ng/ui-typography-helm';
import { FormFieldComponent } from '../../../shared/form-field/form-field.component';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-project-members',
  standalone: true,  imports: [
    ReactiveFormsModule, 
    RouterLink,
    HlmCardDirective, 
    HlmButtonDirective, 
    HlmInputDirective, 
    HlmBadgeDirective,
    HlmSkeletonComponent,
    HlmAvatarComponent,
    HlmAvatarFallbackDirective,
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
  inviteMutation = injectMutation(() => ({
    mutationFn: (data: { email: string; role: string }) =>
      this.projectService.inviteMember(this.id, data.email, data.role),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['project', this.id, 'members'] });
      toast.success('Invitation sent successfully', {
        description: `The invitation has been sent to the specified email address.`
      });
      this.inviteForm.reset({ role: 'MEMBER' });
    },
    onError: (err: any) => {
      let errorMessage = 'An unexpected error occurred while sending the invitation.';
      let errorTitle = 'Error sending invitation';
      
      if (err instanceof HttpErrorResponse) {
        switch (err.status) {
          case 400:
            errorMessage = 'Invalid email address or member role. Please check your input.';
            errorTitle = 'Invalid invitation data';
            break;
          case 401:
            errorMessage = 'You are not authenticated. Please log in again.';
            errorTitle = 'Authentication required';
            break;
          case 403:
            errorMessage = 'You do not have permission to invite members to this project.';
            errorTitle = 'Permission denied';
            break;
          case 404:
            errorMessage = 'Project not found. Please verify the project exists.';
            errorTitle = 'Project not found';
            break;
          case 409:
            errorMessage = 'This user is already a member of the project.';
            errorTitle = 'Member already exists';
            break;
          case 422:
            errorMessage = 'The provided data is invalid. Please check the email format and role.';
            errorTitle = 'Validation error';
            break;
          case 0:
            errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            errorTitle = 'Connection error';
            break;
          default:
            errorMessage = err.error?.message || err.message || errorMessage;
        }
      } else {
        errorMessage = err?.message || errorMessage;
      }
      
      toast.error(errorTitle, {
        description: errorMessage
      });
    },
  }));

  invite() {
    if (this.inviteForm.invalid) {
      toast.error('Invalid form data', {
        description: 'Please check the email address and role selection.'
      });
      return;
    }
    const { email, role } = this.inviteForm.value;
    this.inviteMutation.mutate({ email: email!, role: role! });
  }
}
