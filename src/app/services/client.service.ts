import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin,Observable } from 'rxjs';
import { Client } from '../models/client.model';
import { environment } from '../../environments/environment';
import { PagedClientsResponse } from '../models/paged-clients-response';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = `${environment.apiUrls.smsClient}`;
  private auth = `${environment.apiUrls.smsAuth}`;
    private authUrl = environment.apiUrls.smsTaxidelete;
  constructor(private http: HttpClient) { }

  // Basic CRUD Operations
  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/get-allClients`);
  }

  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/get-client/${id}`);
  }

  getClientByPhone(phone: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/get-Clientnumero_telephone/${phone}`);
  }

  getClientByPhoneSingle(phone: string): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/get-Clientby-phone/${phone}`);
  }

  /*addClient(client: Client): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/add-client`, client);
  }*/
addClientWithUser(client: Client, password: string) {

  const signupPayload = {
    username: client.nom,
    email: client.email,
    roles: ['ROLE_USER'],
    password: password,
    phone: client.telephone
  };

  console.log("REAL signup payload:", signupPayload);

  const signupRequest = this.http.post(
    `${this.auth}/jwt-authentication/api/auth/signup`,
    signupPayload
  );

  const clientRequest = this.http.post(
    `${this.baseUrl}/add-client`,
    client
  );

  return forkJoin([clientRequest, signupRequest]);
}


  addClientGPS(client: Client): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/add-clientgps`, client);
  }

  addClientWithGPS(client: Client): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/add_client_gps`, client);
  }

  /*updateClient(id: number, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/update-client/${id}`, client);
  }*/
updateClient(client: Client, oldTelephone: string) {

  const updateClient$ = this.http.patch(
    `${this.baseUrl}/update-client/${client.id}`,
    client
  );

  const updateUser$ = this.http.patch(
    `${this.auth}/jwt-authentication/api/auth/users-update/${oldTelephone}`,
    {
      username: client.nom,
      email: client.email,
      phone: client.telephone
    }
  );
console.log("Payload for user update:", {
  username: client.nom,
  email: client.email,
  phone: client.telephone
});

  return forkJoin({
    client: updateClient$,
    user: updateUser$
  });
}


  updateClientByPhone(phone: string, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/update_client_phone/${phone}`, client);
  }

  /*deleteClient(id: number): Observable<Client> {
    return this.http.delete<Client>(`${this.baseUrl}/delete-client/${id}`);
  }
*/

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete-client/${id}`);
  }

  deleteAccount(phone: string): Observable<void> {
    return this.http.delete<void>(
      `${this.authUrl}/jwt-authentication/api/auth/delete-account`,
      {
        params: { phone }
      }
    );
  }
  // Client Location Management
  updateClientLocation(phone: string, latitude: number, longitude: number): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/update-client-location/${phone}`, {
      latitude,
      longitude
    });
  }

  updateClientDestination(phone: string, destLat: number, destLng: number): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/update-client-destination/${phone}`, {
      dest_latitude: destLat,
      dest_longitude: destLng
    });
  }

  // Client Validation
  existsByPhone(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/client-exists/${phone}`);
  }

  // Client Statistics
  getClientCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/client-count`);
  }

  getActiveClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/active-clients`);
  }

  getInactiveClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/inactive-clients`);
  }

  // Client Ride History
  getClientRideHistory(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/client-rides/${clientId}`);
  }

  getClientRideStatistics(clientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/client-ride-stats/${clientId}`);
  }

  // Client Expenses
  getClientExpenses(clientId: number, period?: string): Observable<any[]> {
    let url = `${this.baseUrl}/client-expenses/${clientId}`;
    if (period) {
      url += `?period=${period}`;
    }
    return this.http.get<any[]>(url);
  }

  getClientTotalExpenses(clientId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/client-total-expenses/${clientId}`);
  }

  // Client Preferences
  getClientPreferences(clientId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/client-preferences/${clientId}`);
  }

  updateClientPreferences(clientId: number, preferences: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/client-preferences/${clientId}`, preferences);
  }

  // Client Search and Filter
  /*searchClients(query: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/search-clients`, {
      params: { q: query }
    });
  }*/

  searchClientsByPhone(phone: string): Observable<Client> {
  return this.http.get<Client>(
    `${this.baseUrl}/get-Clientnumero_telephone/${phone}`
  );
}


  filterClients(filters: any): Observable<Client[]> {
    return this.http.post<Client[]>(`${this.baseUrl}/filter-clients`, filters);
  }

  getClientsByLocation(lat: number, lng: number, radius: number): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/clients-by-location`, {
      params: { lat: lat.toString(), lng: lng.toString(), radius: radius.toString() }
    });
  }

  // Client Analytics
  getClientAnalytics(period: string, filters?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/client-analytics`, {
      params: { period, ...filters }
    });
  }

  getClientGrowthReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/client-growth-report`, {
      params: { startDate, endDate }
    });
  }

  // Client Segmentation
  getClientSegments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/client-segments`);
  }

  getClientsBySegment(segment: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.baseUrl}/clients-by-segment/${segment}`);
  }

  // Client Communication
  sendClientNotification(clientId: number, message: string, type: 'sms' | 'email' | 'push'): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/send-client-notification`, {
      clientId,
      message,
      type
    });
  }

  getClientNotifications(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/client-notifications/${clientId}`);
  }

  // Client Support
  createClientSupportTicket(clientId: number, issue: string, priority: 'low' | 'medium' | 'high'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/client-support-ticket`, {
      clientId,
      issue,
      priority
    });
  }

  getClientSupportTickets(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/client-support-tickets/${clientId}`);
  }

  // Client Export
  exportClientData(format: 'csv' | 'pdf' | 'excel', filters?: any): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/export-clients`, filters, { 
      responseType: 'blob' 
    });
  }

  // Client Bulk Operations
  addMultipleClients(clients: Client[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/add-multiple-clients`, clients);
  }

  updateMultipleClients(clients: Client[]): Observable<Client[]> {
    return this.http.put<Client[]>(`${this.baseUrl}/update-multiple-clients`, clients);
  }

  // Client Verification
  verifyClientPhone(phone: string, code: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/verify-client-phone`, {
      phone,
      code
    });
  }

  sendVerificationCode(phone: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/send-verification-code`, {
      phone
    });
  }

  // Client Rating and Feedback
  getClientRating(clientId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/client-rating/${clientId}`);
  }

  submitClientFeedback(clientId: number, feedback: any): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/client-feedback`, {
      clientId,
      feedback
    });
  }

  getClientFeedback(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/client-feedback/${clientId}`);
  }

  getClients(page: number = 0, size: number = 5): Observable<PagedClientsResponse> {
  return this.http.get<PagedClientsResponse>(
    `${this.baseUrl}/get-all-clients?page=${page}&size=${size}`
  );
}

}
