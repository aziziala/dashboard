import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Taxi, TaxiStatus } from '../models/taxi.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaxiService {
  private baseUrl = `${environment.apiUrls.smsTaxi}`;

  constructor(private http: HttpClient) { }

  // Basic CRUD Operations
  getTaxis(): Observable<Taxi[]> {
    return this.http.get<Taxi[]>(`${this.baseUrl}/get-taxi`);
  }

  getTaxiById(id: number): Observable<Taxi> {
    return this.http.get<Taxi>(`${this.baseUrl}/get-taxis/${id}`);
  }

  getTaxiByPhone(phone: string): Observable<Taxi[]> {
    return this.http.get<Taxi[]>(`${this.baseUrl}/get-taxinbyphone/${phone}`);
  }

  getTaxiByPhoneSingle(phone: string): Observable<Taxi> {
    return this.http.get<Taxi>(`${this.baseUrl}/taxi_byphone/${phone}`);
  }

  addTaxi(taxi: Taxi): Observable<Taxi> {
    return this.http.post<Taxi>(`${this.baseUrl}/add-taxi`, taxi);
  }

  addTaxiAdmin(taxi: Taxi): Observable<Taxi> {
    return this.http.post<Taxi>(`${this.baseUrl}/add-taxi-admin`, taxi);
  }

  addTaxiGPS(taxi: Taxi): Observable<Taxi> {
    return this.http.post<Taxi>(`${this.baseUrl}/add-taxigps`, taxi);
  }

  updateTaxi(id: number, taxi: Taxi): Observable<Taxi> {
    return this.http.put<Taxi>(`${this.baseUrl}/update-taxi`, taxi);
  }

  updateTaxiByPhone(phone: string, taxi: Taxi): Observable<Taxi> {
    return this.http.put<Taxi>(`${this.baseUrl}/update_taxi_byphone/${phone}`, taxi);
  }

  deleteTaxi(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete-taxi/${id}`);
  }

  // Taxi Status Management
  updateTaxiStatus(taxiId: number, status: TaxiStatus): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/updateTaxiStatus/status`, { 
      taxiId, 
      status 
    });
  }

  checkTaxiStatus(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/checkTaxiStatus/${phone}`);
  }

  // GPS Location Management
  updateTaxiGPSLocation(taxi: Taxi): Observable<Taxi> {
    return this.http.post<Taxi>(`${this.baseUrl}/update_gps_location`, taxi);
  }

  updateTaxiGPS(phone: string, lat: number, lng: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/update_gps/${phone}`, {
      lat_gps: lat,
      lng_gps: lng
    });
  }

  updateTaxiLocation(phone: string, gpsCoordinates: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/locationTaxis/update/${phone}`, gpsCoordinates);
  }

  // Taxi Validation
  existsByPhone(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/existByPhone/${phone}`);
  }

  // Statistics
  getTaxiCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/nbr-taxi`);
  }

  // GPS Simulation (for testing)
  simulateGPSLocation(taxi: Taxi): Observable<Taxi> {
    return this.http.post<Taxi>(`${this.baseUrl}/update_gps_location`, taxi);
  }

  // Advanced Queries
  getTaxisByStatus(status: TaxiStatus): Observable<Taxi[]> {
    return this.http.get<Taxi[]>(`${this.baseUrl}/get-taxis-by-status/${status}`);
  }

  getTaxisByLocation(lat: number, lng: number, radius: number): Observable<Taxi[]> {
    return this.http.get<Taxi[]>(`${this.baseUrl}/get-taxis-by-location`, {
      params: { lat: lat.toString(), lng: lng.toString(), radius: radius.toString() }
    });
  }

  // Bulk Operations
  addMultipleTaxis(taxis: Taxi[]): Observable<Taxi[]> {
    return this.http.post<Taxi[]>(`${this.baseUrl}/add-taxis`, taxis);
  }

  updateMultipleTaxis(taxis: Taxi[]): Observable<Taxi[]> {
    return this.http.put<Taxi[]>(`${this.baseUrl}/update-multiple-taxis`, taxis);
  }

  // Export Operations
  exportTaxis(format: 'csv' | 'pdf' | 'excel', filters?: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/export-taxis`, filters, { 
      responseType: 'blob' 
    });
  }

  // Real-time Updates
  getActiveTaxis(): Observable<Taxi[]> {
    return this.http.get<Taxi[]>(`${this.baseUrl}/active-taxis`);
  }

  getOfflineTaxis(): Observable<Taxi[]> {
    return this.http.get<Taxi[]>(`${this.baseUrl}/offline-taxis`);
  }

  // Taxi Performance
  getTaxiPerformance(taxiId: number, period: 'daily' | 'weekly' | 'monthly'): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/taxi-performance/${taxiId}`, {
      params: { period }
    });
  }

  getTopPerformingTaxis(limit: number = 10): Observable<Taxi[]> {
    return this.http.get<Taxi[]>(`${this.baseUrl}/top-performing-taxis`, {
      params: { limit: limit.toString() }
    });
  }

  // Search and Filter
  searchTaxis(query: string): Observable<Taxi[]> {
    return this.http.get<Taxi[]>(`${this.baseUrl}/search-taxis`, {
      params: { q: query }
    });
  }

  filterTaxis(filters: any): Observable<Taxi[]> {
    return this.http.post<Taxi[]>(`${this.baseUrl}/filter-taxis`, filters);
  }

  // Taxi Assignment
  assignTaxiToClient(taxiId: number, clientId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/assign-taxi`, {
      taxiId,
      clientId
    });
  }

  unassignTaxi(taxiId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/unassign-taxi/${taxiId}`);
  }

  // Emergency and Safety
  sendEmergencyAlert(taxiId: number, message: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/emergency-alert`, {
      taxiId,
      message
    });
  }

  getEmergencyAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/emergency-alerts`);
  }

  // Maintenance and Support
  reportTaxiIssue(taxiId: number, issue: string, priority: 'low' | 'medium' | 'high'): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/report-issue`, {
      taxiId,
      issue,
      priority
    });
  }

  getTaxiIssues(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/taxi-issues`);
  }

  // Analytics and Reporting
  getTaxiAnalytics(period: string, filters?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/taxi-analytics`, {
      params: { period, ...filters }
    });
  }

  getTaxiRevenueReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/taxi-revenue-report`, {
      params: { startDate, endDate }
    });
  }
}
