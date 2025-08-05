import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((x) => x.Login),
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/presentations/presentations').then(
        (x) => x.Presentations
      ),
    canActivate: [authGuard],
  },
  {
    path: 'room/:id',
    loadComponent: () => import('./pages/room/room').then((x) => x.Room),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
