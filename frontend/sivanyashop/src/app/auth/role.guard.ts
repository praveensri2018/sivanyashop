// PLACE IN: src/app/auth/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // allowed roles provided in route.data.roles (array of strings)
    const required = route.data['roles'] as Array<string> | undefined;

    // If route doesn't require roles, allow
    if (!required || required.length === 0) return true;

    // If not logged in, redirect to login
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const role = (this.auth.getRole() || '').toString().toUpperCase();

    // Normalize required roles to uppercase for safe comparison
    const allowed = required.map(r => r.toString().toUpperCase());

    if (allowed.includes(role)) return true;

    // not allowed -> optional unauthorized route
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
