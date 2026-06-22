import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
export interface SessionHistoryDto {
  id: number;
  loginAt: string;
  logoutAt: string;
  duration: string;
  sessionDate: string;
}

export interface TaxiSessionDto {
  username: string;
  phone: string;
  online: boolean;
  lastHeartbeatAt: string;
  history: SessionHistoryDto[];
  totalConnectionsThisMonth: number;
  totalDurationThisMonth: string;
}

export interface TopTaxiDto {
  phone: string;
  username: string;
  rank: number;
  totalConnections: number;
  totalDuration: string;
  currentlyOnline: boolean;
  lastConnectionAt: string;
}

export interface SessionStatsDto {
  totalTaxis: number;
  onlineTaxis: number;
  offlineTaxis: number;
  mostActiveTaxi: string;
  mostActiveConnectionCount: number;
  longestSessionTaxi: string;
  longestSessionDuration: string;
  topTaxis: TopTaxiDto[];
}

export interface DailyStatsDto {
  date: string;
  uniqueTaxisConnected: number;
  totalConnections: number;
  totalDuration: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionStatsServiceService {
private base = 'http://192.168.100.12:8444/taxi-client/api/session';
  constructor(private http: HttpClient) { }

   getGlobalStats(): Observable<SessionStatsDto> {
    return this.http.get<SessionStatsDto>(`${this.base}/global`);
  }
  getAllTaxiSessions(): Observable<TaxiSessionDto[]> {
    return this.http.get<TaxiSessionDto[]>(`${this.base}/all`);
  }
  getTaxiSessionByPhone(phone: string): Observable<TaxiSessionDto> {
    return this.http.get<TaxiSessionDto>(`${this.base}/by-phone/${phone}`);
  }

  getByMonth(phone: string, year: number, month: number): Observable<TaxiSessionDto> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<TaxiSessionDto>(`${this.base}/by-phone/${phone}/month`, { params });
  }

  getByDay(phone: string, date: string): Observable<TaxiSessionDto> {
    const params = new HttpParams().set('date', date);
    return this.http.get<TaxiSessionDto>(`${this.base}/by-phone/${phone}/day`, { params });
  }

  getDailyStats(from: string, to: string): Observable<DailyStatsDto[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<DailyStatsDto[]>(`${this.base}/daily`, { params });
  }
}
