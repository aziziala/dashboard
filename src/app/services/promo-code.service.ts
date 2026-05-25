import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PromoCode } from '../models/promo-code.model';

@Injectable({
  providedIn: 'root'
})
export class PromoCodeService {
   private readonly baseUrl = 'http://192.168.100.12:8444/taxi-client/voucher';
  constructor(private http: HttpClient) { }

   getAllPromos(): Observable<PromoCode[]> {
    return this.http.get<PromoCode[]>(
      `${this.baseUrl}/getallpromo`
    );
  }
  createPromo(promo: PromoCode): Observable<PromoCode> {
    return this.http.post<PromoCode>(
      `${this.baseUrl}/create`,
      promo
    );
  }
  deactivatePromo(promoId: number) {
  return this.http.post(
    `${this.baseUrl}/deactivate?promoId=${promoId}`,
    {}
  );
}
}
