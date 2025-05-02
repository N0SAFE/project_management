import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService, ProjectMember } from '../../services/project.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, MatSelectModule],
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
