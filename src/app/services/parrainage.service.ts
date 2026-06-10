// src/app/services/parrainage.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParrainageService {

  private base = environment.apiUrls.taxiSelect;

  constructor(private http: HttpClient) {}

  getAllReferrals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/referral/all`);
  }

  getReferralByTaxi(taxiId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/referral/taxi/${taxiId}`);
  }

  getReferralHistory(
    referralId: number,
    page = 0,
    size = 20
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<any>(
      `${this.base}/referral/transaction/history/${referralId}`,
      { params }
    );
  }

  getAllTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/referral/transaction/history/all`);
  }

  getConfig(): Observable<any> {
    return this.http.get<any>(`${this.base}/referral-config`);
  }

  marquerPaye(referralId: number, amount: number): Observable<string> {
    return this.http.post(
      `${this.base}/referral/transaction/debit`,
      { referralId, amount, description: 'Paiement admin' },
      { responseType: 'text' }
    );
  }

  credit(referralId: number, amount: number, description = 'Credit admin'): Observable<string> {
    return this.http.post(
      `${this.base}/referral/transaction/credit`,
      { referralId, amount, description },
      { responseType: 'text' }
    );
  }

  generateQrCodes(): Observable<string> {
    return this.http.post(
      `${this.base}/referral/generate-taxis-code`,
      null,
      { responseType: 'text' }
    );
  }
}












