// -> Place this exact file at: src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

/**
 * Basic user shape — extend this with real backend fields.
 * Example: add phone?: string; avatarUrl?: string; etc.
 */
export interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  [key: string]: any;
}

/** Shape of the login response from the backend */
export interface LoginResponse {
  token?: string;
  user?: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // base API from your Postman collection
  private baseUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  /**
   * Login and persist token (if present) to localStorage.
   * Returns an Observable<LoginResponse>
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(
        tap((res) => {
          // typed here as LoginResponse; safe access
          if (res?.token) {
            localStorage.setItem('auth_token', res.token);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Generic typed `me()` helper. Call as: this.auth.me<User>() to get typed response.
   * Default T = any for flexibility.
   */
  me<T = any>(): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/me`);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
