import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { TaxiActifResultDto } from '../models/gestionEtat/TaxiActifResultDto.model';
import { TaxiInactifResultDto } from '../models/gestionEtat/TaxiInactifResultDto.model';
import { TaxiEarningsResultDto } from '../models/gestionEtat/TaxiEarningsResultDto.model';
import { TaxiCoursesResultDto } from '../models/gestionEtat/Taxicoursesresultdto.model';
import { TaxiBonusResultDto } from '../models/gestionEtat/Taxibonusresultdto.model';
import { TaxiTrafficHistoryDto } from '../models/gestionEtat/TaxiTrafficHistoryDto.model';

@Injectable({ providedIn: 'root' })
export class GestionEtatsService {

  // private readonly BASE_URL = 'http://localhost:8442/api/statistics';
  private readonly BASE_URL = 'http://41.225.11.231:8444/taxi-client/api/statistics';



  constructor(private http: HttpClient) { }

  // ── Taxis Actifs ───────────────────────────────────────────────────────────

  getTaxisActifs(
    page: number,
    size: number,
    from?: string,
    to?: string
  ): Observable<TaxiActifResultDto> {
    const params = this.buildParams(page, size, from, to);
    return this.http.get<TaxiActifResultDto>(`${this.BASE_URL}/taxis-actifs`, { params });
  }

  exportTaxisActifsPdf(from?: string, to?: string): Observable<Blob> {
    const params = this.buildDateParams(from, to);
    return this.http.get(`${this.BASE_URL}/taxis-actifs/pdf`, { params, responseType: 'blob' });
  }

  // ── Taxis Inactifs ─────────────────────────────────────────────────────────

  getTaxisInactifs(
    page: number,
    size: number,
    from?: string,
    to?: string
  ): Observable<TaxiInactifResultDto> {
    const params = this.buildParams(page, size, from, to);
    return this.http.get<TaxiInactifResultDto>(`${this.BASE_URL}/taxis-inactifs`, { params });
  }

  exportTaxisInactifsPdf(from?: string, to?: string): Observable<Blob> {
    const params = this.buildDateParams(from, to);
    return this.http.get(`${this.BASE_URL}/taxis-inactifs/pdf`, { params, responseType: 'blob' });
  }

  // ── Taxis Earnings ─────────────────────────────────────────────────────────

  getTaxiEarnings(
    page: number,
    size: number,
    from?: string,
    to?: string
  ): Observable<TaxiEarningsResultDto> {
    const params = this.buildParams(page, size, from, to);
    return this.http.get<TaxiEarningsResultDto>(`${this.BASE_URL}/taxis-earnings`, { params });
  }

  exportTaxiEarningsPdf(from?: string, to?: string): Observable<Blob> {
    const params = this.buildDateParams(from, to);
    return this.http.get(`${this.BASE_URL}/taxis-earnings/pdf`, { params, responseType: 'blob' });
  }


  // ── Taxis Courses ─────────────────────────────────────────────────────────
  getTaxiCourses(
    page: number,
    size: number,
    from?: string,
    to?: string
  ): Observable<TaxiCoursesResultDto> {
    const params = this.buildParams(page, size, from, to);
    return this.http.get<TaxiCoursesResultDto>(`${this.BASE_URL}/taxis-courses`, { params });
  }

  exportTaxiCoursesPdf(from?: string, to?: string): Observable<Blob> {
    const params = this.buildDateParams(from, to);
    return this.http.get(`${this.BASE_URL}/taxis-courses/pdf`, { params, responseType: 'blob' });
  }




  // ── Bonus & Parrainage par Taxi ────────────────────────────────────────────

  getTaxiBonus(page: number, size: number, from?: string, to?: string): Observable<TaxiBonusResultDto> {
    return this.http.get<TaxiBonusResultDto>(
      `${this.BASE_URL}/taxis-bonus`,
      { params: this.buildParams(page, size, from, to) }
    );
  }

  exportTaxiBonusPdf(from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.BASE_URL}/taxis-bonus/pdf`,
      { params: this.buildDateParams(from, to), responseType: 'blob' }
    );
  }


   // ── Historique des courses d'un taxi ──────────────────────────────────────
 
  getTaxiTrafficHistory(
    telephone: string,
    page: number,
    size: number,
    from?: string,
    to?: string
  ): Observable<TaxiTrafficHistoryDto> {
    return this.http.get<TaxiTrafficHistoryDto>(
      `${this.BASE_URL}/taxi-traffic-history/${telephone}`,
      { params: this.buildParams(page, size, from, to) }
    );
  }
 
  exportTaxiTrafficHistoryPdf(telephone: string, from?: string, to?: string): Observable<Blob> {
    return this.http.get(`${this.BASE_URL}/taxi-traffic-history/${telephone}/pdf`,
      { params: this.buildDateParams(from, to), responseType: 'blob' }
    );
  }


  // ── Private helpers ────────────────────────────────────────────────────────

  private buildParams(page: number, size: number, from?: string, to?: string): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.appendDates(params, from, to);
  }

  private buildDateParams(from?: string, to?: string): HttpParams {
    return this.appendDates(new HttpParams(), from, to);
  }

  private appendDates(params: HttpParams, from?: string, to?: string): HttpParams {
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return params;
  }
}