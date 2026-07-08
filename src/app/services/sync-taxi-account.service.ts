import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  SyncTaxiAccountResponse,
  SyncTaxiRegistrationPayload
} from '../models/sync-taxi-account.model';

@Injectable({ providedIn: 'root' })
export class SyncTaxiAccountService {
  /**
   * Same-origin path only (ng serve / nginx proxy). Never a full `http://…` URL —
   * the browser will still show `http://<dashboard-host>:5000/api/…` in DevTools; that is
   * the page origin, not a hardcoded API IP.
   */
  private readonly base = SyncTaxiAccountService.sameOriginApiPath(
    environment.apiUrls.jwtBackend,
    '/api/sync-taxi-account'
  );

  constructor(private readonly http: HttpClient) {}

  /**
   * POST /api/sync-taxi-account/{phone} on :8666 (dev: same path via proxy).
   */
  sync(
    phone: string,
    body?: SyncTaxiRegistrationPayload
  ): Observable<SyncTaxiAccountResponse> {
    const path = `${this.base}/${encodeURIComponent(phone)}`;
    return this.http.post<SyncTaxiAccountResponse>(path, body ?? {});
  }

  /** Coerce env to a root-relative path so requests always go through the dev/prod proxy. */
  private static sameOriginApiPath(raw: string, fallback: string): string {
    const s = (raw || '').trim();
    if (!s) {
      return fallback;
    }
    if (/^https?:\/\//i.test(s)) {
      try {
        const p = new URL(s).pathname;
        return p && p !== '/' ? p : fallback;
      } catch {
        return fallback;
      }
    }
    return s.startsWith('/') ? s : `/${s}`;
  }
}
