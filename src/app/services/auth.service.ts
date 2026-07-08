import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

export interface User {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Same gateway route family as other services (proxy.conf → `/jwt-authentication` → :8444).
   */
  private readonly authBase =
    `${environment.apiUrls.smsAuth}/jwt-authentication/api/auth`;

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<User> {
    if (this.devBypassAuth()) {
      const mock = this.buildDevMockUser(username);
      localStorage.setItem('currentUser', JSON.stringify(mock));
      this.currentUserSubject.next(mock);
      return of(mock);
    }

    return this.http.post<User>(`${this.authBase}/login`, { username, password }).pipe(
      map((user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  verifyIdentity(data: unknown) {
    return this.http.post<unknown>(
      `${environment.apiUrls.smsAuth}/jwt-authentication/api/auth/verify-identity`,
      data
    );
  }

  resetPassword(token: string, password: string) {
    return this.http.post<unknown>(
      `${environment.apiUrls.smsAuth}/jwt-authentication/api/auth/reset-password?token=${encodeURIComponent(token)}`,
      { newPassword: password }
    );
  }

  isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    return user?.permissions?.includes(permission) ?? false;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    if (!user) {
      return false;
    }
    if (user.roles?.includes(role)) {
      return true;
    }
    return user.role === role;
  }

  refreshToken(): Observable<unknown> {
    if (this.devBypassAuth()) {
      return of({});
    }
    return this.http.post<unknown>(`${this.authBase}/refresh`, {});
  }

  changePassword(oldPassword: string, newPassword: string): Observable<unknown> {
    if (this.devBypassAuth()) {
      return of({});
    }
    return this.http.post<unknown>(`${this.authBase}/change-password`, {
      oldPassword,
      newPassword
    });
  }

  private devBypassAuth(): boolean {
    return !environment.production && environment.devBypassBackendAuth;
  }

  private buildDevMockUser(username: string): User {
    const u = (username || 'dev').trim();
    return {
      username: u,
      email: `${u}@local.dev`,
      roles: ['ROLE_ADMIN'],
      permissions: []
    };
  }
}
