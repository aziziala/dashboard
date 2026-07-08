import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, BehaviorSubject } from 'rxjs';

import { Taxi, TaxiStatus } from '../models/taxi.model';
import { environment } from '../../environments/environment';
import { PagedTaxisResponse } from '../models/paged-taxis-response';

@Injectable({
  providedIn: 'root'
})
export class TaxiService {

  // ======================================================
  // APP SWITCH SYSTEM
  // ======================================================

  currentApp: 'SMSTaxi' | 'TaxiSelect' = 'SMSTaxi';

  private appChangedSource =
    new BehaviorSubject<'SMSTaxi' | 'TaxiSelect'>('SMSTaxi');

  appChanged$ = this.appChangedSource.asObservable();

  // ======================================================
  // URLS
  // ======================================================

  private baseUrl = environment.apiUrls.taxiSelect;

  private authUrl = environment.apiUrls.smsTaxidelete;

  private auth = environment.apiUrls.smsAuth;

  constructor(private http: HttpClient) {

    // Restore selected app after refresh

    const savedApp = localStorage.getItem('currentApp') as
      'SMSTaxi' | 'TaxiSelect';

    if (savedApp) {

      this.currentApp = savedApp;

      this.applyAppConfig(savedApp);
    }
  }

  // ======================================================
  // SWITCH BETWEEN SMS TAXI / TAXI SELECT
  // ======================================================

  notifyAppChanged(app: 'SMSTaxi' | 'TaxiSelect') {

    this.currentApp = app;

    localStorage.setItem('currentApp', app);

    this.applyAppConfig(app);

    this.appChangedSource.next(app);
  }

  private applyAppConfig(app: 'SMSTaxi' | 'TaxiSelect') {

    this.baseUrl =
      app === 'SMSTaxi'
        ? environment.apiUrls.smsTaxi
        : environment.apiUrls.taxiSelect;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ======================================================
  // BASIC CRUD
  // ======================================================


  getTaxiById(id: number): Observable<Taxi> {

    return this.http.get<Taxi>(
      `${this.baseUrl}/get-taxis/${id}`
    );
  }

  getTaxiByPhone(phone: string): Observable<Taxi[]> {

    return this.http.get<Taxi[]>(
      `${this.baseUrl}/get-taxinbyphone/${phone}`
    );
  }

  getTaxiByPhoneSingle(phone: string): Observable<Taxi> {

    return this.http.get<Taxi>(
      `${this.baseUrl}/taxi_byphone/${phone}`
    );
  }

  // ======================================================
  // ADD TAXI + USER
  // ======================================================

  addTaxiWithUser(taxi: Taxi, password: string) {

    const taxiRequest = this.http.post(
      `${this.baseUrl}/add-taxis`,
      taxi
    );

    const signupRequest = this.http.post(
      `${this.auth}/auth/signup`,
      {
        username: taxi.nom,
        email: taxi.email,
        role: ['ROLE_USER'],
        password: password,
        phone: taxi.telephone
      }
    );

    return forkJoin([taxiRequest, signupRequest]);
  }



  addTaxiAdmin(taxi: Taxi): Observable<Taxi> {

    return this.http.post<Taxi>(
      `${this.baseUrl}/add-taxi-admin`,
      taxi
    );
  }

  addTaxiGPS(taxi: Taxi): Observable<Taxi> {

    return this.http.post<Taxi>(
      `${this.baseUrl}/add-taxigps`,
      taxi
    );
  }

  // ======================================================
  // UPDATE
  // ======================================================

  updateTaxiAndUser(taxi: Taxi) {

    const updateTaxi$ = this.http.patch(
      `${this.baseUrl}/update-taxi/${taxi.id}`,
      taxi
    );

    const updateUser$ = this.http.patch(
      `${this.auth}/auth/users-update/${taxi.telephone}`,
      {
        username: taxi.nom,
        email: taxi.email,
        phone: taxi.telephone
      }
    );

    return forkJoin({
      taxi: updateTaxi$,
      user: updateUser$
    });
  }

  getCountByHide(hide: boolean): Observable<PagedTaxisResponse> {
  return this.http.get<PagedTaxisResponse>(
    `${this.baseUrl}/get-all-taxis-criteria?page=0&size=1&hide=${hide}`
  );
}

  // ======================================================
  // DELETE
  // ======================================================

  deleteTaxi(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.baseUrl}/delete-taxi/${id}`
    );
  }

  deleteAccount(phone: string): Observable<void> {

    return this.http.delete<void>(
      `${this.authUrl}/auth/delete-account`,
      {
        params: { phone }
      }
    );
  }

  // ======================================================
  // STATUS
  // ======================================================

  updateTaxiStatus(
    taxiId: number,
    status: TaxiStatus
  ): Observable<void> {

    return this.http.patch<void>(
      `${this.baseUrl}/updateTaxiStatus/status`,
      {
        taxiId,
        status
      }
    );
  }

  checkTaxiStatus(phone: string): Observable<boolean> {

    return this.http.get<boolean>(
      `${this.baseUrl}/checkTaxiStatus/${phone}`
    );
  }

  // ======================================================
  // GPS
  // ======================================================

  updateTaxiGPSLocation(taxi: Taxi): Observable<Taxi> {

    return this.http.post<Taxi>(
      `${this.baseUrl}/update_gps_location`,
      taxi
    );
  }

  updateTaxiGPS(
    phone: string,
    lat: number,
    lng: number
  ): Observable<any> {

    return this.http.patch<any>(
      `${this.baseUrl}/update_gps/${phone}`,
      {
        lat_gps: lat,
        lng_gps: lng
      }
    );
  }

  updateTaxiLocation(
    phone: string,
    gpsCoordinates: any
  ): Observable<any> {

    return this.http.patch<any>(
      `${this.baseUrl}/locationTaxis/update/${phone}`,
      gpsCoordinates
    );
  }

  // ======================================================
  // VALIDATION
  // ======================================================

  existsByPhone(phone: string): Observable<boolean> {

    return this.http.get<boolean>(
      `${this.baseUrl}/existByPhone/${phone}`
    );
  }

  // ======================================================
  // STATISTICS
  // ======================================================


getTaxiStats(phone: string): Observable<any> {
  return this.http.get<any>(
    `${this.baseUrl}/taxi/stats/${phone}`
  );
}





  simulateGPSLocation(taxi: Taxi): Observable<Taxi> {

    return this.http.post<Taxi>(
      `${this.baseUrl}/update_gps_location`,
      taxi
    );
  }

  // ======================================================
  // ADVANCED QUERIES
  // ======================================================

  getTaxisByStatus(status: TaxiStatus): Observable<Taxi[]> {

    return this.http.get<Taxi[]>(
      `${this.baseUrl}/get-taxis-by-status/${status}`
    );
  }

  getTaxisByLocation(
    lat: number,
    lng: number,
    radius: number
  ): Observable<Taxi[]> {

    return this.http.get<Taxi[]>(
      `${this.baseUrl}/get-taxis-by-location`,
      {
        params: {
          lat: lat.toString(),
          lng: lng.toString(),
          radius: radius.toString()
        }
      }
    );
  }

  // ======================================================
  // BULK
  // ======================================================

  addMultipleTaxis(taxis: Taxi[]): Observable<Taxi[]> {

    return this.http.post<Taxi[]>(
      `${this.baseUrl}/add-taxis`,
      taxis
    );
  }

  updateMultipleTaxis(taxis: Taxi[]): Observable<Taxi[]> {

    return this.http.put<Taxi[]>(
      `${this.baseUrl}/update-multiple-taxis`,
      taxis
    );
  }

  // ======================================================
  // EXPORT
  // ======================================================

  exportTaxis(
    format: 'csv' | 'pdf' | 'excel',
    filters?: any
  ): Observable<Blob> {

    return this.http.post(
      `${this.baseUrl}/export-taxis`,
      filters,
      {
        responseType: 'blob'
      }
    );
  }

  // ======================================================
  // REALTIME
  // ======================================================

  getActiveTaxis(): Observable<Taxi[]> {

    return this.http.get<Taxi[]>(
      `${this.baseUrl}/active-taxis`
    );
  }

  getOfflineTaxis(): Observable<Taxi[]> {

    return this.http.get<Taxi[]>(
      `${this.baseUrl}/offline-taxis`
    );
  }

  // ======================================================
  // PERFORMANCE
  // ======================================================

  getTaxiPerformance(
    taxiId: number,
    period: 'daily' | 'weekly' | 'monthly'
  ): Observable<any> {

    return this.http.get<any>(
      `${this.baseUrl}/taxi-performance/${taxiId}`,
      {
        params: { period }
      }
    );
  }

  getTopPerformingTaxis(
    limit: number = 10
  ): Observable<Taxi[]> {

    return this.http.get<Taxi[]>(
      `${this.baseUrl}/top-performing-taxis`,
      {
        params: { limit: limit.toString() }
      }
    );
  }

  // ======================================================
  // SEARCH
  // ======================================================




  getTaxisCriteria(
  page: number,
  size: number,
  filters: {
    hide?: boolean;
    phone?: string;
    name?: string;
    status?: TaxiStatus | '';
  } = {}
): Observable<PagedTaxisResponse> {

  let params = new HttpParams()
    .set('page', page)
    .set('size', size)
    .set('sort', 'id,asc');
    

  if (filters.hide !== undefined) {
    params = params.set('hide', filters.hide);
  }

  if (filters.phone) {
    params = params.set('phone', filters.phone);
  }

  if (filters.name) {
    params = params.set('name', filters.name);
  }

  if (filters.status) {
    params = params.set('status', filters.status);
  }

  return this.http.get<PagedTaxisResponse>(
    `${this.baseUrl}/get-all-taxis-criteria`,
    { params }
  );
}


  // ======================================================
  // ASSIGNMENT
  // ======================================================

  assignTaxiToClient(
    taxiId: number,
    clientId: number
  ): Observable<any> {

    return this.http.post<any>(
      `${this.baseUrl}/assign-taxi`,
      {
        taxiId,
        clientId
      }
    );
  }

  unassignTaxi(taxiId: number): Observable<void> {

    return this.http.delete<void>(
      `${this.baseUrl}/unassign-taxi/${taxiId}`
    );
  }

  // ======================================================
  // EMERGENCY
  // ======================================================

  sendEmergencyAlert(
    taxiId: number,
    message: string
  ): Observable<void> {

    return this.http.post<void>(
      `${this.baseUrl}/emergency-alert`,
      {
        taxiId,
        message
      }
    );
  }

  getEmergencyAlerts(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.baseUrl}/emergency-alerts`
    );
  }

  // ======================================================
  // ISSUES
  // ======================================================

  reportTaxiIssue(
    taxiId: number,
    issue: string,
    priority: 'low' | 'medium' | 'high'
  ): Observable<void> {

    return this.http.post<void>(
      `${this.baseUrl}/report-issue`,
      {
        taxiId,
        issue,
        priority
      }
    );
  }

  getTaxiIssues(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.baseUrl}/taxi-issues`
    );
  }

  // ======================================================
  // ANALYTICS
  // ======================================================

  getTaxiAnalytics(
    period: string,
    filters?: any
  ): Observable<any> {

    return this.http.get<any>(
      `${this.baseUrl}/taxi-analytics`,
      {
        params: { period, ...filters }
      }
    );
  }

  getTaxiRevenueReport(
    startDate: string,
    endDate: string
  ): Observable<any> {

    return this.http.get<any>(
      `${this.baseUrl}/taxi-revenue-report`,
      {
        params: { startDate, endDate }
      }
    );
  }

  // ======================================================
  // PASSWORD RESET
  // ======================================================

  sendPasswordResetCode(payload: {
    email: string;
    phone: string;
  }) {

    return this.http.post<any>(
      `${this.auth}/auth/forgot-password-admin`,
      payload
    );
  }

  verifyResetCode(token: string) {

    const url =
      `${this.auth}/auth/password-reset/validate-token`;

    return this.http.post<any>(
      url,
      { token }
    );
  }

  resetPassword(
    token: string,
    payload: { password: string }
  ) {

    return this.http.post(
      `${this.auth}/auth/reset-password?token=${token}`,
      payload
    );
  }

  getTaxiCount(): Observable<number> {
  return this.http.get<number>(`${this.baseUrl}/nbr-taxi`);
}

getTaxiSimStats(): Observable<{
  avecSim: number;
  sansSim: number;
}> {
  return this.http.get<{
    avecSim: number;
    sansSim: number;
  }>(`${this.baseUrl}/taxi-sim-stats`);
}


}