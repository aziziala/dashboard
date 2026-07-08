import { Injectable } from '@angular/core';
import { AuthService, User } from './auth.service';

/**
 * HOTFIX: frontend-only visibility for destructive actions until full auth is wired.
 * Remove or replace when backend authorization is complete.
 */
@Injectable({ providedIn: 'root' })
export class RoleUiService {
  constructor(private readonly auth: AuthService) {}

  /** True if JWT / stored user includes ROLE_ADMIN (or legacy admin role string). */
  isAdmin(): boolean {
    const roles = this.getRoles();
    return (
      roles.includes('ROLE_ADMIN') ||
      roles.includes('ROLE_SUPER_ADMIN') ||
      roles.includes('ADMIN')
    );
  }

  /**
   * Show delete / destructive UI controls.
   * ROLE_USER without admin → hidden. ROLE_ADMIN → shown. Unknown/other → shown.
   */
  canShowDestructiveActions(): boolean {
    const user = this.auth.currentUserValue;
    if (!user) {
      return false;
    }
    const roles = this.getRolesForUser(user);
    if (!roles.length) {
      return false;
    }
    if (this.isAdmin()) {
      return true;
    }
    if (roles.includes('ROLE_USER')) {
      return false;
    }
    return true;
  }

  private getRoles(): string[] {
    const u = this.auth.currentUserValue;
    return u ? this.getRolesForUser(u) : [];
  }

  private getRolesForUser(user: User): string[] {
    const fromArray = user.roles?.length ? [...user.roles] : [];
    const fromScalar =
      user.role && typeof user.role === 'string' ? [user.role] : [];
    return [...new Set([...fromArray, ...fromScalar])];
  }
}
