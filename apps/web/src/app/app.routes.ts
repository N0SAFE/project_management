import { Routes } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'invitation/:token',
    loadComponent: () =>
      import('./auth/components/invitation-accept/invitation-accept.component')
        .then((m) => m.InvitationAcceptComponent),
  },
  {
    path: 'invitations/accept/:token',
    loadComponent: () =>
      import('./auth/components/invitation-accept/invitation-accept.component')
        .then((m) => m.InvitationAcceptComponent),
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './projects/components/project-list/project-list.component'
          ).then((m) => m.ProjectListComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import(
            './projects/components/project-create/project-create.component'
          ).then((m) => m.ProjectCreateComponent),
      },
      {
        path: ':id',
        children: [
          {
            path: '',
            loadComponent: () =>
              import(
                './projects/components/project-detail/project-detail.component'
              ).then((m) => m.ProjectDetailComponent),
          },
          {
            path: 'members',
            loadComponent: () =>
              import(
                './projects/components/project-members/project-members.component'
              ).then((m) => m.ProjectMembersComponent),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import(
                './projects/components/project-settings/project-settings.component'
              ).then((m) => m.ProjectSettingsComponent),
          },
          {
            path: 'tasks',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import(
                    './tasks/components/task-list/task-list.component'
                  ).then((m) => m.TaskListComponent),
              },
              {
                path: 'kanban',
                loadComponent: () =>
                  import(
                    './tasks/components/task-kanban/task-kanban.component'
                  ).then((m) => m.TaskKanbanComponent),
              },
              {
                path: 'create',
                loadComponent: () =>
                  import(
                    './tasks/components/task-create-edit/task-create-edit.component'
                  ).then((m) => m.TaskCreateEditComponent),
              },
              {
                path: ':taskId',
                loadComponent: () =>
                  import(
                    './tasks/components/task-detail/task-detail.component'
                  ).then((m) => m.TaskDetailComponent),
              },
              {
                path: ':taskId/edit',
                loadComponent: () =>
                  import(
                    './tasks/components/task-create-edit/task-create-edit.component'
                  ).then((m) => m.TaskCreateEditComponent),
              },
            ],
          },
        ],
      },
    ],
  },
];
