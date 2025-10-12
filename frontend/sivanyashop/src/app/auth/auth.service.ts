// PLACE AT: src/app/auth/auth.service.ts
// Replaces previous AuthService. Adds currentUser$ BehaviorSubject so components update immediately.
// Comments: "where to place" are in this header.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, BehaviorSubject } from 'rxjs';
import { AppConfig } from '../app.config';

// Role type expected from backend (uppercase)
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
  private storageKey = 'user';
  private apiBase = AppConfig.apiBase.replace(/\/+$/, '');

  // IMPORTANT: components subscribe to this to react immediately to login/logout.
  private _currentUser$ = new BehaviorSubject<UserPayload | null>(this._readUserFromStorage());
  public readonly currentUser$ = this._currentUser$.asObservable();

  constructor(private http: HttpClient) {}

  // ---------- Login (calls setUser which will emit) ----------
  login(email: string, password: string, remember = true): Observable<UserPayload> {
    const url = `${this.apiBase}/api/auth/login`;
    return this.http.post<any>(url, { email, password }).pipe(
      map(res => {
        const payload = (res && res.data) ? res.data : res;
        const token = payload.token ?? payload.accessToken ?? payload.jwt ?? null;
        const rawUser = payload.user ?? payload.userInfo ?? payload;
        const rawRole = (rawUser && (rawUser.role ?? payload.role)) ?? null;
        const role = rawRole ? String(rawRole).toUpperCase() as Role : null;

        const user: UserPayload = {
          id: rawUser?.id ?? rawUser?.userId ?? null,
          name: rawUser?.name ?? rawUser?.username ?? rawUser?.fullName ?? null,
          email: rawUser?.email ?? null,
          role,
          token
        };

        // Persist and emit (setUser will both persist and this._currentUser$.next(user))
        this.setUser(user, !remember);
        return user;
      })
    );
  }

  // ---------- Persist user in storage and emit to subscribers ----------
  setUser(user: UserPayload | null, useSession = false) {
    if (user == null) {
      // clear storage
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.storageKey);
    } else {
      const serialized = JSON.stringify(user);
      if (useSession) sessionStorage.setItem(this.storageKey, serialized);
      else localStorage.setItem(this.storageKey, serialized);
    }

    // Emit new user so header/footer update immediately
    try {
      this._currentUser$.next(user);
    } catch (e) {
      console.warn('AuthService: failed to emit currentUser$', e);
    }
  }

  // ---------- Helpers ----------
  getUser(): UserPayload | null {
    return this._readUserFromStorage();
  }

  getToken(): string | null {
    return this._readUserFromStorage()?.token ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): Role {
    return this._readUserFromStorage()?.role ?? null;
  }

  // Clear user and emit null
  clear() {
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
    try { this._currentUser$.next(null); } catch {}
  }

  logout() {
    this.clear();
  }

  register(name: string, email: string, password: string, remember = true) {
  const url = `${this.apiBase}/api/auth/register`;

  return this.http.post<any>(url, { name, email, password }).pipe(
    map(res => {
      // backend shape: { success: true, data: { token, user } }
      const data = res?.data ?? {};
      const user = data.user ?? {};
      const token = data.token ?? null;

      // force role to CUSTOMER for all new users
      const userPayload: UserPayload = {
        id: user.id ?? null,
        name: user.name ?? '',
        email: user.email ?? '',
        role: 'CUSTOMER',
        token
      };

      // store user & emit change
      this.setUser(userPayload, !remember);

      return userPayload; // emits observable for frontend
    })
  );
}

  // ---------- Internal: read from storage (prefers localStorage then sessionStorage) ----------
  private _readUserFromStorage(): UserPayload | null {
    const raw = localStorage.getItem(this.storageKey) ?? sessionStorage.getItem(this.storageKey);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserPayload; } catch { return null; }
  }
}
