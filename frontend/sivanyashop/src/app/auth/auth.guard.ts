// src/app/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    // Check for login in localStorage or sessionStorage
    const isLoggedIn = !!(localStorage.getItem('user') || sessionStorage.getItem('user'));

    if (!isLoggedIn) {
      // Not logged in — redirect to shop (public page)
      this.router.navigate(['/']);
      return false;
    }

    // Logged in — allow access
    return true;
  }
}
