import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  /** Base URL — matches the Swagger server: http://41.225.11.231:8444/taxi-client */
  private readonly base = 'http://41.225.11.231:8444/taxi-client/api/statistics';

  constructor(private http: HttpClient) {}

  // ── Date helpers ────────────────────────────────────────────────────────────

  /** Build from/to params from period + year selections */
  static buildDateRange(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    year: number
  ): { from: string; to: string } {
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (y: number, m: number, d: number) =>
      `${y}-${pad(m)}-${pad(d)}`;

    const now = new Date();

    switch (period) {
      case 'daily': {
        const d = fmt(now.getFullYear(), now.getMonth() + 1, now.getDate());
        return { from: d, to: d };
      }
      case 'weekly': {
        const day = now.getDay(); // 0=Sun
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((day + 6) % 7));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
          from: fmt(monday.getFullYear(), monday.getMonth() + 1, monday.getDate()),
          to:   fmt(sunday.getFullYear(), sunday.getMonth() + 1, sunday.getDate()),
        };
      }
      case 'monthly': {
        const m = now.getMonth() + 1;
        const lastDay = new Date(year, m, 0).getDate();
        return { from: fmt(year, m, 1), to: fmt(year, m, lastDay) };
      }
      case 'quarterly': {
        const q = Math.floor((now.getMonth()) / 3); // 0-based quarter
        const startMonth = q * 3 + 1;
        const endMonth = startMonth + 2;
        const lastDay = new Date(year, endMonth, 0).getDate();
        return { from: fmt(year, startMonth, 1), to: fmt(year, endMonth, lastDay) };
      }
      case 'yearly':
      default:
        return { from: fmt(year, 1, 1), to: fmt(year, 12, 31) };
    }
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