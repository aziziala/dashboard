import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SmsRecord, SmsStatus, SmsType, SmsStatistics, SmsFilter } from '../models/sms-record.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SmsService {
  private baseUrl = `${environment.apiUrls.smsOut}`;

  constructor(private http: HttpClient) { }

  // SMS Records Management - Based on SMSout backend API
  getSmsRecords(): Observable<SmsRecord[]> {
    return this.http.get<SmsRecord[]>(`${this.baseUrl}/get-listSMS_out`);
  }

  getSmsRecordById(id: number): Observable<SmsRecord> {
    return this.http.get<SmsRecord>(`${this.baseUrl}/get-sms-record/${id}`);
  }

  getIncomingSms(): Observable<SmsRecord[]> {
    return this.http.get<SmsRecord[]>(`${this.baseUrl}/get-list`);
  }

  getOutgoingSms(): Observable<SmsRecord[]> {
    return this.http.get<SmsRecord[]>(`${this.baseUrl}/get-listSMS_out`);
  }

  addSmsRecord(record: SmsRecord): Observable<SmsRecord> {
    return this.http.post<SmsRecord>(`${this.baseUrl}/add-SMS_out`, record);
  }

  updateSmsRecord(id: number, record: SmsRecord): Observable<SmsRecord> {
    return this.http.put<SmsRecord>(`${this.baseUrl}/update-SMS_out/${id}`, record);
  }

  deleteSmsRecord(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete-SMS_out/${id}`);
  }

  // SMS Statistics - Based on SMSout backend API
  getTotalSmsCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/nbr-NbrSMSOut`);
  }

  getSmsByMonth(month: number, year: number): Observable<SmsRecord[]> {
    return this.http.get<SmsRecord[]>(`${this.baseUrl}/listSMS_out_ParMois/${month}/${year}`);
  }

  // SMS Status Management
  updateSmsStatus(id: number, status: SmsStatus): Observable<SmsRecord> {
    return this.http.patch<SmsRecord>(`${this.baseUrl}/update-sms-status/${id}`, { status });
  }

  retrySms(id: number): Observable<SmsRecord> {
    return this.http.post<SmsRecord>(`${this.baseUrl}/retry-sms/${id}`, {});
  }

  // SMS Sending
  sendSms(phone: string, message: string, type: SmsType = SmsType.OUTGOING): Observable<SmsRecord> {
    return this.http.post<SmsRecord>(`${this.baseUrl}/send-sms`, {
      phone,
      message,
      type
    });
  }

  sendBulkSms(recipients: string[], message: string, type: SmsType = SmsType.OUTGOING): Observable<SmsRecord[]> {
    return this.http.post<SmsRecord[]>(`${this.baseUrl}/send-bulk-sms`, {
      recipients,
      message,
      type
    });
  }

  sendScheduledSms(phone: string, message: string, scheduledTime: Date): Observable<SmsRecord> {
    return this.http.post<SmsRecord>(`${this.baseUrl}/send-scheduled-sms`, {
      phone,
      message,
      scheduledTime
    });
  }

  // SMS Templates
  getSmsTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sms-templates`);
  }

  createSmsTemplate(template: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sms-templates`, template);
  }

  updateSmsTemplate(id: number, template: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/sms-templates/${id}`, template);
  }

  deleteSmsTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sms-templates/${id}`);
  }

  // SMS Statistics and Analytics
  getSmsStatistics(period?: string): Observable<SmsStatistics> {
    let url = `${this.baseUrl}/sms-statistics`;
    if (period) {
      url += `?period=${period}`;
    }
    return this.http.get<SmsStatistics>(url);
  }

  getSmsStatisticsByDateRange(startDate: string, endDate: string): Observable<SmsStatistics> {
    return this.http.get<SmsStatistics>(`${this.baseUrl}/sms-statistics-range`, {
      params: { startDate, endDate }
    });
  }

  getSmsDeliveryReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sms-delivery-report`, {
      params: { startDate, endDate }
    });
  }

  // SMS Filtering and Search
  filterSmsRecords(filters: SmsFilter): Observable<SmsRecord[]> {
    return this.http.post<SmsRecord[]>(`${this.baseUrl}/filter-sms-records`, filters);
  }

  searchSmsRecords(query: string): Observable<SmsRecord[]> {
    return this.http.get<SmsRecord[]>(`${this.baseUrl}/search-sms-records`, {
      params: { q: query }
    });
  }

  getSmsByPhone(phone: string): Observable<SmsRecord[]> {
    return this.http.get<SmsRecord[]>(`${this.baseUrl}/sms-by-phone/${phone}`);
  }

  getSmsByStatus(status: SmsStatus): Observable<SmsRecord[]> {
    return this.http.get<SmsRecord[]>(`${this.baseUrl}/sms-by-status/${status}`);
  }

  getSmsByType(type: SmsType): Observable<SmsRecord[]> {
    return this.http.get<SmsRecord[]>(`${this.baseUrl}/sms-by-type/${type}`);
  }

  // SMS Gateway Management
  getSmsGatewayStatus(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sms-gateway-status`);
  }

  testSmsGateway(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/test-sms-gateway`, {});
  }

  updateSmsGatewaySettings(settings: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/sms-gateway-settings`, settings);
  }

  // SMS Queue Management
  getSmsQueue(): Observable<SmsRecord[]> {
    return this.http.get<SmsRecord[]>(`${this.baseUrl}/sms-queue`);
  }

  clearSmsQueue(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clear-sms-queue`);
  }

  prioritizeSms(id: number): Observable<SmsRecord> {
    return this.http.patch<SmsRecord>(`${this.baseUrl}/prioritize-sms/${id}`, {});
  }

  // SMS Error Handling
  getSmsErrors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sms-errors`);
  }

  getSmsErrorDetails(errorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sms-error-details/${errorId}`);
  }

  resolveSmsError(errorId: number, resolution: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/resolve-sms-error/${errorId}`, { resolution });
  }

  // SMS Reports
  generateSmsReport(filters: SmsFilter, format: 'csv' | 'pdf' | 'excel'): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/generate-sms-report`, filters, { 
      responseType: 'blob' 
    });
  }

  getSmsUsageReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sms-usage-report`, {
      params: { startDate, endDate }
    });
  }

  // SMS Notifications
  getSmsNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sms-notifications`);
  }

  markNotificationAsRead(notificationId: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/mark-notification-read/${notificationId}`, {});
  }

  // SMS Cost Management
  getSmsCosts(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sms-costs`, {
      params: { startDate, endDate }
    });
  }

  getSmsCostBreakdown(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sms-cost-breakdown`);
  }

  // SMS Compliance
  checkSmsCompliance(message: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/check-sms-compliance`, { message });
  }

  getComplianceRules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/compliance-rules`);
  }

  // SMS Integration
  integrateWithExternalService(serviceName: string, credentials: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/integrate-external-service`, {
      serviceName,
      credentials
    });
  }

  testExternalIntegration(serviceName: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/test-external-integration`, { serviceName });
  }

  // SMS Backup and Recovery
  backupSmsRecords(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/backup-sms-records`, { 
      responseType: 'blob' 
    });
  }

  restoreSmsRecords(backupFile: File): Observable<void> {
    const formData = new FormData();
    formData.append('backupFile', backupFile);
    return this.http.post<void>(`${this.baseUrl}/restore-sms-records`, formData);
  }

  // SMS Monitoring
  getSmsHealthMetrics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sms-health-metrics`);
  }

  getSmsPerformanceMetrics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sms-performance-metrics`);
  }

  // SMS Automation
  createSmsAutomation(automation: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sms-automation`, automation);
  }

  getSmsAutomations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sms-automations`);
  }

  updateSmsAutomation(id: number, automation: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/sms-automation/${id}`, automation);
  }

  deleteSmsAutomation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sms-automation/${id}`);
  }
}
