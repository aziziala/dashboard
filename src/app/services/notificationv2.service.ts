import { Injectable }             from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable }             from 'rxjs';

import { SendNotificationRequest }     from '../models/notification/SendNotificationRequest.model';
import { PagedTaxiCriteriaResponse }   from '../models/notification/PagedTaxiCriteriaResponse.model';
import { PagedClientCriteriaResponse } from '../models/notification/PagedClientCriteriaResponse.model';
import { PagedNotificationResponse } from '../models/notification/PagedNotificationResponse.model';


@Injectable({ providedIn: 'root' })
export class Notificationv2Service {

private readonly BASE_URL = '/taxi-client/api';

  constructor(private http: HttpClient) {}

  // ── Send notification ──────────────────────────────────────────────────────

  send(payload: SendNotificationRequest): Observable<string> {
    return this.http.post(
      `${this.BASE_URL}/notifications/send`,
      payload,
      { responseType: 'text' }
    );
  }

  // ── Taxi criteria list ─────────────────────────────────────────────────────

getTaxisByCriteria(
  page = 0,
  size = 10,
  phone?: string,
  name?: string
): Observable<PagedTaxiCriteriaResponse> {

  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());

  if (phone?.trim()) {
    params = params.set('phone', phone.trim());
  }

  if (name?.trim()) {
    params = params.set('name', name.trim());
  }

  return this.http.get<PagedTaxiCriteriaResponse>(
    `${this.BASE_URL}/get-all-taxis-criteria`,
    { params }
  );
}

  // ── Client criteria list ───────────────────────────────────────────────────

  getClientsByCriteria(
    page   = 0,
    size   = 10,
    phone?: string,
    name?:  string
  ): Observable<PagedClientCriteriaResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (phone) params = params.set('phone', phone);
    if (name)  params = params.set('name',  name);
    return this.http.get<PagedClientCriteriaResponse>(
      `${this.BASE_URL}/get-all-clients-criteria`, { params }
    );
  }




    // ── Notification list with filter ──────────────────────────────────────────

  getAllWithFilter(
    page    = 0,
    size    = 10,
    title?:   string,
    message?: string,
    sort?:    string
  ): Observable<PagedNotificationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (title)   params = params.set('title',   title);
    if (message) params = params.set('message', message);
    if (sort)    params = params.set('sort',    sort);
    return this.http.get<PagedNotificationResponse>(
      `${this.BASE_URL}/notifications/all/filter`, { params }
    );
  }



  //////  by target 

  getLatestByTarget(targetType: string, page = 0, size = 5): Observable<any> {
    return this.http.get<any>(
      `${this.BASE_URL}/notifications/target/${targetType}?page=${page}&size=${size}&sort=createdAt,desc`
    );
  }


}