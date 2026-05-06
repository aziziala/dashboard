import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private base = 'http://41.225.11.231:8444/taxi-client/api/statistics';

  constructor(private http: HttpClient) {}

  private params(from: string, to: string): HttpParams {
    return new HttpParams().set('from', from).set('to', to);
  }

  getOverview(from: string, to: string): Observable<any> {
    return this.http.get(`${this.base}/overview`, { params: this.params(from, to) });
  }

  getRevenueStats(from: string, to: string): Observable<any> {
    return this.http.get(`${this.base}/revenue`, { params: this.params(from, to) });
  }

  getRevenueTrends(from: string, to: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/revenue/trends`, { params: this.params(from, to) });
  }

  getTopDrivers(from: string, to: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/top-drivers`, { params: this.params(from, to) });
  }

  getTopZones(from: string, to: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/top-zones`, { params: this.params(from, to) });
  }

  getRidesDistribution(from: string, to: string): Observable<any> {
    return this.http.get(`${this.base}/rides/distribution`, { params: this.params(from, to) });
  }

  getCancellationStats(from: string, to: string): Observable<any> {
    return this.http.get(`${this.base}/rides/cancellations`, { params: this.params(from, to) });
  }

  getHourlyStats(from: string, to: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/rides/hourly`, { params: this.params(from, to) });
  }
}