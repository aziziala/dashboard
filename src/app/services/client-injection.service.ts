import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface InjectSmsPayload {
  contenu: string;
  telephone: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientInjectionService {
  private readonly baseUrl = 'http://41.225.11.231:80/taxi-client/api';

  constructor(private http: HttpClient) { }

  injectSms(contenu: string, telephone: string): Observable<any> {
    const payload: InjectSmsPayload = { contenu, telephone };
    return this.http.post(`${this.baseUrl}/inject-sms`, payload);
  }
}