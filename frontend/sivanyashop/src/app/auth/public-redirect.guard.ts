import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PublicRedirectGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    // If user is NOT logged in → allow access to the public route
    if (!this.auth.isLoggedIn()) {
      return true;
    }

    // Get role from AuthService (normalized)
    const role = (this.auth.getRole() || '').toString().toUpperCase();

    // Redirect logged-in users to their specific dashboard
    if (role === 'ADMIN') {
      return this.router.createUrlTree(['/admin']);
    }

    if (role === 'RETAILER') {
      return this.router.createUrlTree(['/retailer']);
    }

    // Default: assume customer
    return this.router.createUrlTree(['/dashboard']);
  }
}
