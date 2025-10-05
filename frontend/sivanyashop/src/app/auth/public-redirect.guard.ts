// PLACE IN: src/app/auth/public-redirect.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PublicRedirectGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    // If not logged in, allow access to public routes (login/register)
    if (!this.auth.isLoggedIn()) return true;

    // Use the stored role (uppercase): 'ADMIN' | 'RETAILER' | 'CUSTOMER'
    const role = (this.auth.getRole() || '').toString().toUpperCase();

    // Redirect logged-in users to their role-specific area
    if (role === 'ADMIN') this.router.navigate(['/admin']);
    else if (role === 'RETAILER') this.router.navigate(['/retailer']);
    else this.router.navigate(['/customer']);

    // prevent navigation to public page
    return false;
  }
}
