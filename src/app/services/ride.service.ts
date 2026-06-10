


import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  RideRequest,
  RideOffer,
  RideStatus,
  RideMatching,
  RideStatistics
} from '../models/ride.model';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RideService {

  // =====================================================
  // BASE URL
  // =====================================================

  private baseUrl = environment.apiUrls.taxiSelect;

  constructor(
    private http: HttpClient
  ) {}

  // =====================================================
  // RIDE REQUESTS (DEMANDES)
  // =====================================================

  /**
   * GET ALL DEMANDES
   * NOTE:
   * Backend currently returns 500 in your server
   */
  getRideRequests(): Observable<RideRequest[]> {

    return this.http.get<RideRequest[]>(
      `${this.baseUrl}/get-demande`
    );
  }

  /**
   * GET DEMANDE BY ID
   */
  getRideRequestById(
    id: number
  ): Observable<RideRequest> {

    return this.http.get<RideRequest>(
      `${this.baseUrl}/get-demande/${id}`
    );
  }

  /**
   * GET DEMANDES BY STATUS
   */
  getRideRequestsByStatus(
    status: string
  ): Observable<RideRequest[]> {

    return this.http.get<RideRequest[]>(
      `${this.baseUrl}/get-listDemandeParEtat/${status}`
    );
  }

  /**
   * CREATE DEMANDE
   */
  addRideRequest(
    request: RideRequest
  ): Observable<RideRequest> {

    return this.http.post<RideRequest>(
      `${this.baseUrl}/add-demande`,
      request
    );
  }

  /**
   * UPDATE DEMANDE
   */
  updateRideRequest(
    request: RideRequest
  ): Observable<RideRequest> {

    return this.http.put<RideRequest>(
      `${this.baseUrl}/update-demande`,
      request
    );
  }

  /**
   * UPDATE DEMANDE STATUS
   */
  updateRideRequestStatus(
    requestId: number,
    status: RideStatus
  ): Observable<void> {

    return this.http.put<void>(
      `${this.baseUrl}/update-EtatDemande/${status}`,
      {
        id: requestId
      }
    );
  }

  /**
   * DELETE DEMANDE
   */
  deleteRideRequest(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.baseUrl}/delete-demande/${id}`
    );
  }

  // =====================================================
  // RIDE OFFERS (OFFRES)
  // =====================================================

  /**
   * GET ALL OFFERS
   * NOTE:
   * Backend currently returns 404
   */
  getRideOffers(): Observable<RideOffer[]> {

    return this.http.get<RideOffer[]>(
      `${this.baseUrl}/get-offre`
    );
  }

  /**
   * GET OFFER BY ID
   */
  getRideOfferById(
    id: number
  ): Observable<RideOffer> {

    return this.http.get<RideOffer>(
      `${this.baseUrl}/get-offre/${id}`
    );
  }

  /**
   * GET OFFER BY TAXI PHONE
   */
  getRideOfferByTaxi(
    phone: string
  ): Observable<RideOffer> {

    return this.http.get<RideOffer>(
      `${this.baseUrl}/offre_matching_taxi/${phone}`
    );
  }

  /**
   * GET OFFER BY CLIENT PHONE
   */
  getRideOfferByClient(
    phone: string
  ): Observable<RideOffer> {

    return this.http.get<RideOffer>(
      `${this.baseUrl}/offre_matching_client/${phone}`
    );
  }

  /**
   * CREATE OFFER
   */
  addRideOffer(
    offer: RideOffer
  ): Observable<RideOffer> {

    return this.http.post<RideOffer>(
      `${this.baseUrl}/add-offre`,
      offer
    );
  }

  /**
   * UPDATE OFFER
   */
  updateRideOffer(
    offer: RideOffer
  ): Observable<RideOffer> {

    return this.http.put<RideOffer>(
      `${this.baseUrl}/update-offre`,
      offer
    );
  }

  /**
   * UPDATE OFFER STATUS
   */
  updateRideOfferStatus(
    offerId: number,
    status: RideStatus
  ): Observable<void> {

    return this.http.put<void>(
      `${this.baseUrl}/update-EtatOffre/${status}`,
      {
        id: offerId
      }
    );
  }

  /**
   * DELETE OFFER
   */
  deleteRideOffer(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.baseUrl}/delete-Offre/${id}`
    );
  }

  // =====================================================
  // RIDE MATCHING
  // =====================================================

  /**
   * ASSIGN TAXI TO REQUEST
   */
  assignTaxiToRequest(
    requestId: number,
    taxiId: number
  ): Observable<RideMatching> {

    return this.http.post<RideMatching>(
      `${this.baseUrl}/assign-taxi-to-request`,
      {
        requestId,
        taxiId
      }
    );
  }

  /**
   * GET NEARBY TAXIS
   */
  getNearbyTaxis(
    latitude: number,
    longitude: number,
    radius: number = 5
  ): Observable<RideMatching[]> {

    const params = new HttpParams()
      .set('lat', latitude.toString())
      .set('lng', longitude.toString())
      .set('radius', radius.toString());

    return this.http.get<RideMatching[]>(
      `${this.baseUrl}/nearby-taxis`,
      { params }
    );
  }

  // =====================================================
  // RIDE STATISTICS
  // =====================================================

  /**
   * OVERVIEW STATISTICS
   * CORRECT SWAGGER ENDPOINT
   */
  getRideStatistics(): Observable<any> {

    return this.http.get<any>(
      `${this.baseUrl}/statistics/overview`
    );
  }

  /**
   * STATISTICS WITH DATE RANGE
   */
  getRideStatisticsByDateRange(
    startDate: string,
    endDate: string
  ): Observable<any> {

    const params = new HttpParams()
      .set('from', startDate)
      .set('to', endDate);

    return this.http.get<any>(
      `${this.baseUrl}/statistics/overview`,
      { params }
    );
  }

  // =====================================================
  // MANUAL OPERATIONS
  // =====================================================

  /**
   * MANUAL ASSIGN
   */
  manuallyAssignRide(
    requestId: number,
    taxiId: number
  ): Observable<RideOffer> {

    return this.http.post<RideOffer>(
      `${this.baseUrl}/manual-assign-ride`,
      {
        requestId,
        taxiId
      }
    );
  }

  /**
   * CANCEL RIDE
   */
  cancelRide(
    rideId: number,
    reason: string
  ): Observable<void> {

    return this.http.put<void>(
      `${this.baseUrl}/cancel-ride/${rideId}`,
      {
        reason
      }
    );
  }

  // =====================================================
  // REAL-TIME
  // =====================================================

  /**
   * ACTIVE RIDES
   */
  getActiveRides(): Observable<RideOffer[]> {

    return this.http.get<RideOffer[]>(
      `${this.baseUrl}/active-rides`
    );
  }

  /**
   * RIDE HISTORY
   */
  getRideHistory(
    clientId?: number,
    taxiId?: number
  ): Observable<RideOffer[]> {

    let params = new HttpParams();

    if (clientId) {
      params = params.set('clientId', clientId.toString());
    }

    if (taxiId) {
      params = params.set('taxiId', taxiId.toString());
    }

    return this.http.get<RideOffer[]>(
      `${this.baseUrl}/ride-history`,
      { params }
    );
  }

  // =====================================================
  // RIDE TRAJECTORIES
  // =====================================================

  /**
   * GET RIDE TRAJECTORY
   * Swagger:
   * GET /api/offres/{offreId}/trajectory
   */
  getRideTrajectory(
    offreId: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.baseUrl}/offres/${offreId}/trajectory`
    );
  }

  /**
   * GET RIDE TRAJECTORY SUMMARY
   * Swagger:
   * GET /api/offres/{offreId}/trajectory/summary
   */
  getRideTrajectorySummary(
    offreId: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.baseUrl}/offres/${offreId}/trajectory/summary`
    );
  }

  /**
   * GET ACTIVE TAXI TRAJECTORY
   * Swagger:
   * GET /api/taxis/{taxiId}/trajectory/active
   */
  getActiveTaxiTrajectory(
    taxiId: number
  ): Observable<any> {

    return this.http.get<any>(
      `${this.baseUrl}/taxis/${taxiId}/trajectory/active`
    );
  }

    // =====================================================
  // OFFERS PAGINATION
  // =====================================================

  /**
   * LIST OFFERS (PAGINATED)
   * Swagger:
   * /api/offres/list/page
   */
  getOffersPage(
    page: number = 0,
    size: number = 10,
    filters: any = {}
  ): Observable<any> {

    let params: any = {

      page,

      size
    };

    // STATUS
    if (filters.status) {

      params.status = filters.status;
    }

    // SEARCH
    if (filters.search) {

      params.search = filters.search;
    }

    // DATE RANGE
    if (filters.dateFrom) {

      params.dateDepotFrom =
        filters.dateFrom;
    }

    if (filters.dateTo) {

      params.dateDepotTo =
        filters.dateTo;
    }

    return this.http.get<any>(

      `${this.baseUrl}/offres/list/page`,

      { params }
    );
  }

}