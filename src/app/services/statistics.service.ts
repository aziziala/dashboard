import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
private api = 'http://41.225.11.231:8444/taxi-client/api/statistics';

  constructor(private http: HttpClient) {}

  getOverview(from: string, to: string) {
    return this.http.get(`${this.api}/overview`, { params: { from, to } });
  }

getTopTaxis() {
  return this.http.get<any[]>(`${this.api}/top/taxis`);
}

getTopClients() {
  return this.http.get<any[]>(`${this.api}/top/clients`);
}
  getTrends(from: string, to: string) {
    return this.http.get(`${this.api}/trends/rides-revenue`, {
      params: { bucket: 'MONTH', from, to }
    });
  }

  getFunnel(from: string, to: string) {
    return this.http.get(`${this.api}/demands/funnel`, { params: { from, to } });
  }

  getRevenueTrends(from: string, to: string) {
  return this.http.get<any[]>(
    `${this.api}/trends/rides-revenue`,
    {
      params: {
        bucket: 'MONTH',
        from,
        to
      }
    }
  );
}
}