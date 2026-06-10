import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface StatisticsOverviewDto {
  totalRides: number;
  totalRevenue: number;
  totalClients: number;
  totalTaxis: number;
  successRate: number;
  avgRideDuration?: number;
  avgRideDistance?: number;
}

export interface TimeSeriesPointDto {
  bucketStart: string;
  revenue?: number;
  profit?: number;
  rides?: number;
}

export interface TaxiPerformanceDto {
  taxiId: number;
  nom?: string;
  telephone?: string;
  revenue?: number;
  rating?: number;
  totalRides?: number;
}

export interface ClientPerformanceDto {
  clientId: number;
  clientName?: string;
  totalRides?: number;
  totalSpent?: number;
}

export interface ReferralTaxiStatsDto {
  referralCode?: string;
  taxiName?: string;
  totalReferrals?: number;
  revenue?: number;
}

export type BucketSize = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  private baseUrl = environment.apiUrls.taxiSelect;

  constructor(private http: HttpClient) {}

  // ─────────────────────────────────────────────────────────────────────────
  // STATIC HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  static buildDateRange(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    year: number
  ): { from: string; to: string } {

    const pad = (n: number) => String(n).padStart(2, '0');

    const today = new Date();

    switch (period) {

      case 'daily': {
        const d = today.toISOString().split('T')[0];
        return { from: d, to: d };
      }

      case 'weekly': {
        const day = today.getDay();
        const mon = new Date(today);
        mon.setDate(today.getDate() - ((day + 6) % 7));
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        return {
          from: mon.toISOString().split('T')[0],
          to:   sun.toISOString().split('T')[0],
        };
      }

      case 'monthly': {
        const m = pad(today.getMonth() + 1);
        const last = new Date(year, today.getMonth() + 1, 0).getDate();
        return {
          from: `${year}-${m}-01`,
          to:   `${year}-${m}-${pad(last)}`,
        };
      }

      case 'quarterly': {
        const q = Math.floor(today.getMonth() / 3);
        const startM = q * 3;
        const endM   = startM + 2;
        const last = new Date(year, endM + 1, 0).getDate();
        return {
          from: `${year}-${pad(startM + 1)}-01`,
          to:   `${year}-${pad(endM + 1)}-${pad(last)}`,
        };
      }

      case 'yearly':
      default:
        return {
          from: `${year}-01-01`,
          to:   `${year}-12-31`,
        };
    }
  }

  static periodToBucket(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  ): BucketSize {

    switch (period) {
      case 'daily':     return 'DAY';
      case 'weekly':    return 'DAY';
      case 'monthly':   return 'DAY';
      case 'quarterly': return 'MONTH';
      case 'yearly':    return 'MONTH';
      default:          return 'DAY';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ENDPOINTS  (paths from swagger)
  // ─────────────────────────────────────────────────────────────────────────

  getOverview(
    from: string,
    to: string
  ): Observable<StatisticsOverviewDto> {

    const params = new HttpParams()
      .set('from', from)
      .set('to', to);

    return this.http.get<StatisticsOverviewDto>(
      `${this.baseUrl}/statistics/overview`, { params }
    );
  }

  getRevenueTrends(
    from: string,
    to: string,
    bucket: BucketSize,
    limit: number = 20
  ): Observable<TimeSeriesPointDto[]> {

    const params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('bucketSize', bucket)
      .set('limit', limit.toString());

    return this.http.get<TimeSeriesPointDto[]>(
      `${this.baseUrl}/statistics/trends/rides-revenue`, { params }
    );
  }

  getTopTaxis(
    from: string,
    to: string,
    sortBy: string = 'RIDES',
    page: number = 0,
    size: number = 10
  ): Observable<TaxiPerformanceDto[]> {

    const params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('sortBy', sortBy)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<TaxiPerformanceDto[]>(
      `${this.baseUrl}/statistics/top/taxis`, { params }
    );
  }

  getTopClients(
    from: string,
    to: string,
    sortBy: string = 'RIDES',
    page: number = 0,
    size: number = 10
  ): Observable<ClientPerformanceDto[]> {

    const params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('sortBy', sortBy)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ClientPerformanceDto[]>(
      `${this.baseUrl}/statistics/top/clients`, { params }
    );
  }

  // No referral-taxis endpoint exists → return empty
  getTopReferralTaxis(
    page: number = 0,
    size: number = 10
  ): Observable<ReferralTaxiStatsDto[]> {
    return of([]);
  }
}
