import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ─── Response DTOs (match Swagger schemas exactly) ──────────────────────────

export interface StatisticsOverviewDto {
  totalRevenue: number;
  totalRides: number;
  totalTaxis: number;
  totalClients: number;
  ridesLast24h: number;
  avgRidesPerDay: number;
  avgRidesPerMonth: number;
  avgRidesPerYear: number;
  successRate: number;        // [0..1]
  cancellationRate: number;   // [0..1]
  statusDistribution: StatusDistributionDto;
}

export interface StatusDistributionDto {
  pending: number;
  active: number;
  completed: number;
  cancelledByTaxi: number;
  cancelledByClient: number;
  expired: number;
  cancelled: number;
}

export interface TimeSeriesPointDto {
  bucketStart: string;   // ISO-8601 UTC
  rides: number;
  revenue: number;
  profit?: number;
}

export interface TaxiPerformanceDto {
  taxiId: number;
  telephone: string;
  nom: string;
  rides: number;
  revenue: number;
  rating: number;
}

export interface ClientPerformanceDto {
  clientId: number;
  telephone: string;
  name: string;
  rides: number;
  revenue: number;
  avgRideRating?: number;
}

export interface DemandFunnelDto {
  totalDemands: number;
  matchedDemands: number;
  completedRides: number;
  matchRate: number;
  completionRate: number;
}

export interface DemandStatusDistributionDto {
  waiting: number;
  active: number;
  terminated: number;
  cancelledByTaxi: number;
  cancelledByClient: number;
  expired: number;
  cancelled: number;
}

export interface WindowedActivityDto {
  rides24h: number;
  rides7d: number;
  rides30d: number;
  revenue24h: number;
  revenue7d: number;
  revenue30d: number;
}

export interface RevenueStatsDto {
  totalRevenue: number;
  avgRevenuePerRide: number;
  medianRevenuePerRide: number;
  completedRides: number;
}

export interface CancellationRankingDto {
  id: number;
  telephone: string;
  name: string;
  cancellations: number;
}

export interface FeesOptionSegmentDto {
  feesOption: 'T1' | 'T2' | 'T3';
  rides: number;
  revenue: number;
}

export interface DemandVsCompletedPointDto {
  bucketStart: string;
  demandsCreated: number;
  ridesCompleted: number;
}

export type BucketSize = 'DAY' | 'MONTH' | 'YEAR';

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StatisticsService {

  /** Base URL — proxied through dev server (see `proxy.conf.js` → /taxi-client/api) */
  private readonly base = `${environment.apiUrls.taxiSelect}/statistics`;

  constructor(private http: HttpClient) {}

  // ── Date helpers ────────────────────────────────────────────────────────────

  /** Build from/to params from period + year selections */
static buildDateRange(period: string, year?: number): { from: string; to: string } {
  const now = new Date();

  let from: Date;
  let to: Date = new Date();

  switch (period) {

    case 'daily':
      from = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0, 0, 0
      );

      to = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23, 59, 59
      );
      break;

    case 'weekly':
      from = new Date(now);
      from.setDate(now.getDate() - 7);
      break;

    case 'monthly':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;

    case 'quarterly':
      from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;

    case 'yearly':
      from = new Date(now.getFullYear(), 0, 1);
      break;

    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString()
  };
}

  /** Map period → best bucket size for charts */
  static periodToBucket(period: string): BucketSize {
    switch (period) {
      case 'daily':   return 'DAY';
      case 'weekly':  return 'DAY';
      case 'monthly': return 'DAY';
      case 'quarterly': return 'MONTH';
      case 'yearly':  return 'MONTH';
      default:        return 'MONTH';
    }
  }

  // ── Endpoints ───────────────────────────────────────────────────────────────

  /** GET /api/statistics/overview — KPI cards */
  getOverview(from: string, to: string): Observable<StatisticsOverviewDto> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<StatisticsOverviewDto>(`${this.base}/overview`, { params });
  }

  /** GET /api/statistics/trends/rides-revenue — Revenue & profit chart */
  getRevenueTrends(
    from: string,
    to: string,
    bucket: BucketSize = 'MONTH',
    profitMarginPercent?: number
  ): Observable<TimeSeriesPointDto[]> {
    let params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('bucket', bucket);
    if (profitMarginPercent != null) {
      params = params.set('profitMarginPercent', String(profitMarginPercent));
    }
    return this.http.get<TimeSeriesPointDto[]>(
      `${this.base}/trends/rides-revenue`, { params }
    );
  }

  /** GET /api/statistics/trends/demands-vs-completed — Demand vs completed trend */
  getDemandsVsCompleted(
    from: string,
    to: string,
    bucket: BucketSize = 'MONTH'
  ): Observable<DemandVsCompletedPointDto[]> {
    const params = new HttpParams()
      .set('from', from).set('to', to).set('bucket', bucket);
    return this.http.get<DemandVsCompletedPointDto[]>(
      `${this.base}/trends/demands-vs-completed`, { params }
    );
  }

  /** GET /api/statistics/top/taxis — Top taxis table */
  getTopTaxis(
    from: string,
    to: string,
    sortBy: 'REVENUE' | 'RIDES' | 'RATING' = 'REVENUE',
    page = 0,
    size = 10
  ): Observable<TaxiPerformanceDto[]> {
    const params = new HttpParams()
      .set('from', from).set('to', to)
      .set('sortBy', sortBy)
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<TaxiPerformanceDto[]>(`${this.base}/top/taxis`, { params });
  }

  /** GET /api/statistics/top/clients — Top clients table */
  getTopClients(
    from: string,
    to: string,
    sortBy: 'REVENUE' | 'RIDES' | 'RATING' = 'RIDES',
    page = 0,
    size = 10
  ): Observable<ClientPerformanceDto[]> {
    const params = new HttpParams()
      .set('from', from).set('to', to)
      .set('sortBy', sortBy)
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<ClientPerformanceDto[]>(`${this.base}/top/clients`, { params });
  }

  /** GET /api/statistics/demands/funnel — Demand funnel */
  getDemandFunnel(from: string, to: string): Observable<DemandFunnelDto> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<DemandFunnelDto>(`${this.base}/demands/funnel`, { params });
  }

  /** GET /api/statistics/demands/distribution — Demand status distribution */
  getDemandDistribution(from: string, to: string): Observable<DemandStatusDistributionDto> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<DemandStatusDistributionDto>(
      `${this.base}/demands/distribution`, { params }
    );
  }

  /** GET /api/statistics/activity/windows — Rolling 24h/7d/30d */
  getWindowedActivity(): Observable<WindowedActivityDto> {
    return this.http.get<WindowedActivityDto>(`${this.base}/activity/windows`);
  }

  /** GET /api/statistics/revenue/stats — Revenue deep-dive */
  getRevenueStats(from: string, to: string): Observable<RevenueStatsDto> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<RevenueStatsDto>(`${this.base}/revenue/stats`, { params });
  }

  /** GET /api/statistics/segments/fees-option — Fees option segmentation */
  getFeesOptionSegments(from: string, to: string): Observable<FeesOptionSegmentDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<FeesOptionSegmentDto[]>(
      `${this.base}/segments/fees-option`, { params }
    );
  }

  /** GET /api/statistics/cancellations/top/taxis */
  getTopTaxiCancellations(
    from: string, to: string, page = 0, size = 10
  ): Observable<CancellationRankingDto[]> {
    const params = new HttpParams()
      .set('from', from).set('to', to)
      .set('page', String(page)).set('size', String(size));
    return this.http.get<CancellationRankingDto[]>(
      `${this.base}/cancellations/top/taxis`, { params }
    );
  }

  /** GET /api/statistics/cancellations/top/clients */
  getTopClientCancellations(
    from: string, to: string, page = 0, size = 10
  ): Observable<CancellationRankingDto[]> {
    const params = new HttpParams()
      .set('from', from).set('to', to)
      .set('page', String(page)).set('size', String(size));
    return this.http.get<CancellationRankingDto[]>(
      `${this.base}/cancellations/top/clients`, { params }
    );
  }

  /** GET /api/statistics/latency/match — Match latency stats */
  getMatchLatency(from: string, to: string): Observable<any> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<any>(`${this.base}/latency/match`, { params });
  }
}