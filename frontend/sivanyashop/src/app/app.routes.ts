import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component'; // <-- Add this import

export const routes: Routes = [
  { path: 'login', component: LoginComponent }, // <-- login page route
  { path: 'dashboard', component: DashboardComponent }, // <-- dashboard route
  { path: '', redirectTo: '/login', pathMatch: 'full' } // <-- default redirect
];
