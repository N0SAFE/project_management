import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'projects',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./projects/components/project-list/project-list.component').then(m => m.ProjectListComponent) },
      { path: 'create', loadComponent: () => import('./projects/components/project-create/project-create.component').then(m => m.ProjectCreateComponent) },
      { path: ':id', loadComponent: () => import('./projects/components/project-detail/project-detail.component').then(m => m.ProjectDetailComponent) },
      { path: ':id/members', loadComponent: () => import('./projects/components/project-members/project-members.component').then(m => m.ProjectMembersComponent) },
    ]
  }
];
