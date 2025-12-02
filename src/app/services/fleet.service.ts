import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FleetLocation, FleetStatus, FleetStatistics, NearbyTaxiResponse } from '../models/fleet-location.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FleetService {
  private baseUrl = `${environment.apiUrls.fleet}`;

  constructor(private http: HttpClient) { }

  // Fleet Location Management
  getFleetLocations(): Observable<FleetLocation[]> {
    return this.http.get<FleetLocation[]>(`${this.baseUrl}/fleet-locations`);
  }

  getFleetLocationById(id: number): Observable<FleetLocation> {
    return this.http.get<FleetLocation>(`${this.baseUrl}/fleet-location/${id}`);
  }

  getFleetLocationByTaxi(taxiId: number): Observable<FleetLocation> {
    return this.http.get<FleetLocation>(`${this.baseUrl}/fleet-location/taxi/${taxiId}`);
  }

  updateFleetLocation(location: FleetLocation): Observable<FleetLocation> {
    return this.http.put<FleetLocation>(`${this.baseUrl}/fleet-location/${location.id}`, location);
  }

  updateTaxiLocation(taxiId: number, latitude: number, longitude: number): Observable<FleetLocation> {
    return this.http.patch<FleetLocation>(`${this.baseUrl}/update-taxi-location/${taxiId}`, {
      latitude,
      longitude
    });
  }

  // Fleet Status Management
  updateFleetStatus(taxiId: number, status: FleetStatus): Observable<FleetLocation> {
    return this.http.patch<FleetLocation>(`${this.baseUrl}/update-fleet-status/${taxiId}`, { status });
  }

  getFleetByStatus(status: FleetStatus): Observable<FleetLocation[]> {
    return this.http.get<FleetLocation[]>(`${this.baseUrl}/fleet-by-status/${status}`);
  }

  getActiveFleet(): Observable<FleetLocation[]> {
    return this.http.get<FleetLocation[]>(`${this.baseUrl}/active-fleet`);
  }

  getInactiveFleet(): Observable<FleetLocation[]> {
    return this.http.get<FleetLocation[]>(`${this.baseUrl}/inactive-fleet`);
  }

  // Fleet Statistics
  getFleetStatistics(): Observable<FleetStatistics> {
    return this.http.get<FleetStatistics>(`${this.baseUrl}/fleet-statistics`);
  }

  getFleetStatisticsByDateRange(startDate: string, endDate: string): Observable<FleetStatistics> {
    return this.http.get<FleetStatistics>(`${this.baseUrl}/fleet-statistics-range`, {
      params: { startDate, endDate }
    });
  }

  getFleetPerformanceMetrics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fleet-performance-metrics`);
  }

  // Nearby Taxi Search
  getNearbyTaxis(latitude: number, longitude: number, radius: number = 5): Observable<NearbyTaxiResponse[]> {
    return this.http.get<NearbyTaxiResponse[]>(`${this.baseUrl}/nearby-taxis`, {
      params: { lat: latitude.toString(), lng: longitude.toString(), radius: radius.toString() }
    });
  }

  findNearestTaxi(latitude: number, longitude: number, maxDistance: number = 10): Observable<NearbyTaxiResponse> {
    return this.http.get<NearbyTaxiResponse>(`${this.baseUrl}/nearest-taxi`, {
      params: { lat: latitude.toString(), lng: longitude.toString(), maxDistance: maxDistance.toString() }
    });
  }

  // Fleet Coverage and Analytics
  getFleetCoverageArea(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fleet-coverage-area`);
  }

  getFleetHeatmap(centerLat: number, centerLng: number, zoom: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fleet-heatmap`, {
      params: { centerLat: centerLat.toString(), centerLng: centerLng.toString(), zoom: zoom.toString() }
    });
  }

  getFleetDistribution(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fleet-distribution`);
  }

  // Fleet Movement Tracking
  getFleetMovementHistory(taxiId: number, startTime: string, endTime: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/fleet-movement-history/${taxiId}`, {
      params: { startTime, endTime }
    });
  }

  getFleetSpeedAnalysis(taxiId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fleet-speed-analysis/${taxiId}`);
  }

  getFleetRouteOptimization(startPoint: any, endPoint: any, constraints?: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/fleet-route-optimization`, {
      startPoint,
      endPoint,
      constraints
    });
  }

  // Fleet Assignment and Dispatch
  assignTaxiToRequest(requestId: number, taxiId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/assign-taxi-to-request`, {
      requestId,
      taxiId
    });
  }

  getAvailableTaxisForRequest(requestId: number, pickupLat: number, pickupLng: number): Observable<NearbyTaxiResponse[]> {
    return this.http.get<NearbyTaxiResponse[]>(`${this.baseUrl}/available-taxis-for-request/${requestId}`, {
      params: { pickupLat: pickupLat.toString(), pickupLng: pickupLng.toString() }
    });
  }

  // Fleet Monitoring and Alerts
  getFleetAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/fleet-alerts`);
  }

  createFleetAlert(alert: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/fleet-alerts`, alert);
  }

  updateFleetAlert(alertId: number, alert: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/fleet-alerts/${alertId}`, alert);
  }

  resolveFleetAlert(alertId: number, resolution: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/resolve-fleet-alert/${alertId}`, { resolution });
  }

  // Fleet Maintenance and Support
  getFleetMaintenanceSchedule(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/fleet-maintenance-schedule`);
  }

  scheduleFleetMaintenance(maintenance: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/fleet-maintenance`, maintenance);
  }

  updateFleetMaintenance(maintenanceId: number, maintenance: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/fleet-maintenance/${maintenanceId}`, maintenance);
  }

  // Fleet Reports and Analytics
  generateFleetReport(reportType: string, filters?: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/generate-fleet-report`, filters, { 
      responseType: 'blob' 
    });
  }

  getFleetEfficiencyReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fleet-efficiency-report`, {
      params: { startDate, endDate }
    });
  }

  getFleetUtilizationReport(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fleet-utilization-report`);
  }

  // Fleet Communication
  sendFleetBroadcast(message: string, filters?: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/fleet-broadcast`, {
      message,
      filters
    });
  }

  getFleetCommunicationHistory(taxiId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/fleet-communication-history/${taxiId}`);
  }

  // Fleet Emergency and Safety
  sendEmergencyAlert(taxiId: number, emergency: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/fleet-emergency-alert`, {
      taxiId,
      emergency
    });
  }

  getEmergencyAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/fleet-emergency-alerts`);
  }

  // Fleet Performance Tracking
  getFleetPerformanceRanking(period: string, limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/fleet-performance-ranking`, {
      params: { period, limit: limit.toString() }
    });
  }

  getFleetEfficiencyMetrics(taxiId: number, period: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fleet-efficiency-metrics/${taxiId}`, {
      params: { period }
    });
  }

  // Fleet Export and Import
  exportFleetData(format: 'csv' | 'pdf' | 'excel', filters?: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/export-fleet-data`, filters, { 
      responseType: 'blob' 
    });
  }

  importFleetData(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/import-fleet-data`, formData);
  }

  // Fleet Real-time Updates
  getFleetRealTimeUpdates(): Observable<FleetLocation[]> {
    return this.http.get<FleetLocation[]>(`${this.baseUrl}/fleet-real-time-updates`);
  }

  subscribeToFleetUpdates(taxiIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/subscribe-fleet-updates`, { taxiIds });
  }

  unsubscribeFromFleetUpdates(subscriptionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/unsubscribe-fleet-updates/${subscriptionId}`);
  }
}
