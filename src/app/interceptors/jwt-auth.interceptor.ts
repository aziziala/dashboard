import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * Attaches JWT from localStorage `currentUser`, then dev fallbacks, for proxied gateway paths.
 */
@Injectable()
export class JwtAuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (this.shouldSkipAuthHeader(req)) {
      return next.handle(req);
    }

    const token = this.resolveBearerToken();
    if (!token) {
      return next.handle(req);
    }

    if (!this.shouldAttachToken(req.url)) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
    );
  }

  private shouldSkipAuthHeader(req: HttpRequest<unknown>): boolean {
    const u = req.url.toLowerCase();
    if (req.method === 'POST' && u.includes('/auth/login')) {
      return true;
    }
    if (u.includes('forgot-password-admin')) {
      return true;
    }
    if (u.includes('password-reset/validate-token')) {
      return true;
    }
    if (u.includes('/auth/reset-password') && req.method === 'POST') {
      return true;
    }
    return false;
  }

  private shouldAttachToken(url: string): boolean {
    return (
      url.includes('/taxi-client/') ||
      url.includes('/jwt-authentication/') ||
      url.includes('/fleet-api') ||
      url.includes('/api/sync-taxi-account') ||
      url.includes('/taxi-direct-auth/') ||
      url.includes('/taxi-direct-taxi/')
    );
  }

  private resolveBearerToken(): string | null {
    const fromUser = this.readTokenFromStorage();
    if (fromUser) {
      return fromUser;
    }
    if (environment.production) {
      return null;
    }
    const hard = (environment as { devHardcodedBearerToken?: string })
      .devHardcodedBearerToken;
    if (typeof hard === 'string' && hard.trim().length > 0) {
      return hard.trim();
    }
    try {
      const k = localStorage.getItem('DEV_GATEWAY_JWT');
      return k && k.trim().length > 0 ? k.trim() : null;
    } catch {
      return null;
    }
  }

  private readTokenFromStorage(): string | null {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) {
        return null;
      }
      const u = JSON.parse(raw) as Record<string, unknown>;
      return this.extractToken(u);
    } catch {
      return null;
    }
  }

  private extractToken(obj: Record<string, unknown> | null): string | null {
    if (!obj || typeof obj !== 'object') {
      return null;
    }
    const direct =
      (obj['accessToken'] as string) ||
      (obj['token'] as string) ||
      (obj['jwt'] as string) ||
      (obj['access_token'] as string) ||
      (obj['bearerToken'] as string) ||
      (obj['idToken'] as string);
    if (typeof direct === 'string' && direct.length > 0) {
      return direct;
    }
    const data = obj['data'] as Record<string, unknown> | undefined;
    if (data) {
      return this.extractToken(data);
    }
    return null;
  }
}
