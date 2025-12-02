import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RideRequest, RideOffer, RideStatus, RideMatching, RideStatistics } from '../models/ride.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RideService {
  private baseUrl = `${environment.apiUrls}`;

  constructor(private http: HttpClient) { }

  // Ride Requests (Demandes)
  getRideRequests(): Observable<RideRequest[]> {
    return this.http.get<RideRequest[]>(`${this.baseUrl}/get-demande`);
  }

  getRideRequestById(id: number): Observable<RideRequest> {
    return this.http.get<RideRequest>(`${this.baseUrl}/get-demande/${id}`);
  }

  getRideRequestsByStatus(status: string): Observable<RideRequest[]> {
    return this.http.get<RideRequest[]>(`${this.baseUrl}/get-listDemandeParEtat/${status}`);
  }

  addRideRequest(request: RideRequest): Observable<RideRequest> {
    return this.http.post<RideRequest>(`${this.baseUrl}/add-demande`, request);
  }

  updateRideRequest(request: RideRequest): Observable<RideRequest> {
    return this.http.put<RideRequest>(`${this.baseUrl}/update-demande`, request);
  }

  updateRideRequestStatus(requestId: number, status: RideStatus): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/update-EtatDemande/${status}`, { id: requestId });
  }

  deleteRideRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete-demande/${id}`);
  }

  // Ride Offers (Offres)
  getRideOffers(): Observable<RideOffer[]> {
    return this.http.get<RideOffer[]>(`${this.baseUrl}/get-offre`);
  }

  getRideOfferById(id: number): Observable<RideOffer> {
    return this.http.get<RideOffer>(`${this.baseUrl}/get-offre/${id}`);
  }

  getRideOfferByTaxi(phone: string): Observable<RideOffer> {
    return this.http.get<RideOffer>(`${this.baseUrl}/offre_matching_taxi/${phone}`);
  }

  getRideOfferByClient(phone: string): Observable<RideOffer> {
    return this.http.get<RideOffer>(`${this.baseUrl}/offre_matching_client/${phone}`);
  }

  addRideOffer(offer: RideOffer): Observable<RideOffer> {
    return this.http.post<RideOffer>(`${this.baseUrl}/add-offre`, offer);
  }

  updateRideOffer(offer: RideOffer): Observable<RideOffer> {
    return this.http.put<RideOffer>(`${this.baseUrl}/update-offre`, offer);
  }

  updateRideOfferStatus(offerId: number, status: RideStatus): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/update-offre-status/${offerId}`, { status });
  }

  deleteRideOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete-Offre/${id}`);
  }

  // Ride Matching
  assignTaxiToRequest(requestId: number, taxiId: number): Observable<RideMatching> {
    return this.http.post<RideMatching>(`${this.baseUrl}/assign-taxi-to-request`, {
      requestId,
      taxiId
    });
  }

  getNearbyTaxis(latitude: number, longitude: number, radius: number = 5): Observable<RideMatching[]> {
    return this.http.get<RideMatching[]>(`${this.baseUrl}/nearby-taxis`, {
      params: { lat: latitude.toString(), lng: longitude.toString(), radius: radius.toString() }
    });
  }

  // Ride Statistics
  getRideStatistics(): Observable<RideStatistics> {
    return this.http.get<RideStatistics>(`${this.baseUrl}/ride-statistics`);
  }

  getRideStatisticsByDateRange(startDate: string, endDate: string): Observable<RideStatistics> {
    return this.http.get<RideStatistics>(`${this.baseUrl}/ride-statistics-range`, {
      params: { startDate, endDate }
    });
  }

  // Manual Operations
  manuallyAssignRide(requestId: number, taxiId: number): Observable<RideOffer> {
    return this.http.post<RideOffer>(`${this.baseUrl}/manual-assign-ride`, {
      requestId,
      taxiId
    });
  }

  cancelRide(rideId: number, reason: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/cancel-ride/${rideId}`, { reason });
  }

  // Real-time Updates
  getActiveRides(): Observable<RideOffer[]> {
    return this.http.get<RideOffer[]>(`${this.baseUrl}/active-rides`);
  }

  getRideHistory(clientId?: number, taxiId?: number): Observable<RideOffer[]> {
    let url = `${this.baseUrl}/ride-history`;
    if (clientId) {
      url += `?clientId=${clientId}`;
    } else if (taxiId) {
      url += `?taxiId=${taxiId}`;
    }
    return this.http.get<RideOffer[]>(url);
  }
}
