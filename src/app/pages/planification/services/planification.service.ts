import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AssignTaxiRequest,
  PageResponse,
  ReservationResponse,
  ReservationStatus,
  ReservationWithAssignmentRequest,
  UpdateReservationRequest
} from '../models/reservation.model';
import { GetAllTaxisDtoResponse, SortCriterion } from '../models/taxi.model';
import { environment } from '../../../../environments/environment';

/**
 * Toute la logique métier vit côté backend (IReservationManagementService) ;
 * ce service ne fait que router + construire les query params, à l'image de
 * GestionEtatsService pour le reste du dashboard.
 */
@Injectable({ providedIn: 'root' })
export class PlanificationService {
  // Adapter selon environment.ts — l'API admin réservations tourne sur 8577
  // dans les tests fournis (idem pour /get-all-taxis-criteria).
  private readonly reservationBaseUrl = `${environment.taxiApiUrl ?? 'http://localhost:8577'}/api/admin/reservations`;
  private readonly taxiBaseUrl = `${environment.taxiApiUrl ?? 'http://localhost:8577'}/api`;

  constructor(private http: HttpClient) {}

  // ── Réservations ──────────────────────────────────────────────────────

  createWithAssignment(payload: ReservationWithAssignmentRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.reservationBaseUrl}/with-assignment`, payload);
  }

  getById(id: number): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.reservationBaseUrl}/${id}`);
  }

  list(
    page: number,
    size: number,
    status?: ReservationStatus | '',
    sort: string = 'createdAt,desc'
  ): Observable<PageResponse<ReservationResponse>> {
    let params = this.buildParams(page, size, sort);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<PageResponse<ReservationResponse>>(this.reservationBaseUrl, { params });
  }

  update(id: number, payload: UpdateReservationRequest): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(`${this.reservationBaseUrl}/${id}`, payload);
  }

  assignTaxi(id: number, payload: AssignTaxiRequest): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(`${this.reservationBaseUrl}/${id}/assignment`, payload);
  }

  unassignTaxi(id: number, cancelledBy?: string, reason?: string): Observable<ReservationResponse> {
    let params = new HttpParams();
    if (cancelledBy) {
      params = params.set('cancelledBy', cancelledBy);
    }
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.delete<ReservationResponse>(`${this.reservationBaseUrl}/${id}/assignment`, { params });
  }

  // ── Taxis (pour le picker d'affectation) ────────────────────────────────

  getAllTaxisCriteria(
    page: number,
    size: number,
    sort: SortCriterion[] = [{ field: 'phone', direction: 'desc' }],
    phone?: string,
    name?: string
  ): Observable<PageResponse<GetAllTaxisDtoResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', JSON.stringify(sort));
    if (phone) {
      params = params.set('phone', phone);
    }
    if (name) {
      params = params.set('name', name);
    }
    return this.http.get<PageResponse<GetAllTaxisDtoResponse>>(
      `${this.taxiBaseUrl}/get-all-taxis-criteria`,
      { params }
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private buildParams(page: number, size: number, sort: string): HttpParams {
    return new HttpParams().set('page', page).set('size', size).set('sort', sort);
  }
}
