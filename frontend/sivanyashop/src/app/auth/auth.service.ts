// PLACE IN: src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AppConfig } from '../app.config';

// Use uppercase role strings to match backend ("ADMIN", "RETAILER", "CUSTOMER")
export type Role = 'ADMIN' | 'RETAILER' | 'CUSTOMER' | null;

export interface UserPayload {
  id?: number | string;
  name?: string;
  email?: string;
  role: Role;
  token?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private storageKey = 'user';           // serialized user object key
  private apiBase = AppConfig.apiBase.replace(/\/+$/, '');

  constructor(private http: HttpClient) {}

  /**
   * Login.
   * - Accepts remember flag: true -> localStorage (persist), false -> sessionStorage
   * - Maps backend shape: { success: true, data: { token, user: {...} } }
   */
  login(email: string, password: string, remember = true): Observable<UserPayload> {
    const url = `${this.apiBase}/api/auth/login`;
    return this.http.post<any>(url, { email, password }).pipe(
      map(res => {
        // backend shape handling: prefer res.data if present
        const payload = (res && res.data) ? res.data : res;

        // token might be at payload.token or payload.token (based on your snippet)
        const token = payload.token ?? payload.accessToken ?? payload.jwt ?? null;

        // user object might be payload.user or payload (if backend flattened)
        const rawUser = payload.user ?? payload.userInfo ?? payload;

        // Normalize role to uppercase strings expected elsewhere
        const rawRole = (rawUser && (rawUser.role ?? payload.role)) ?? null;
        const role = rawRole ? String(rawRole).toUpperCase() as Role : null;

        const user: UserPayload = {
          id: rawUser?.id ?? rawUser?.userId ?? null,
          name: rawUser?.name ?? rawUser?.username ?? rawUser?.fullName ?? null,
          email: rawUser?.email ?? null,
          role,
          token
        };

        // store user (useSession = !remember) — true => sessionStorage
        this.setUser(user, !remember);

        return user;
      })
    );
  }

  /**
   * Persist serialized user
   * useSession: when true => sessionStorage, otherwise localStorage
   */
  setUser(user: UserPayload, useSession = false) {
    const serialized = JSON.stringify(user);
    if (useSession) sessionStorage.setItem(this.storageKey, serialized);
    else localStorage.setItem(this.storageKey, serialized);
  }

  getUser(): UserPayload | null {
    const raw = localStorage.getItem(this.storageKey) ?? sessionStorage.getItem(this.storageKey);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserPayload; }
    catch { return null; }
  }

  getToken(): string | null {
    return this.getUser()?.token ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // return an uppercase role string or null
  getRole(): Role {
    return this.getUser()?.role ?? null;
  }

  clear() {
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
  }

  logout() {
    this.clear();
  }
}
