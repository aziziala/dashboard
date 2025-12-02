import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id?: number;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: any;
  source: 'system' | 'fleet' | 'sms' | 'rides' | 'clients' | 'taxis';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  ALERT = 'ALERT',
  SYSTEM = 'SYSTEM',
  MAINTENANCE = 'MAINTENANCE',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  BUSINESS = 'BUSINESS'
}

export enum NotificationSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface NotificationFilter {
  type?: NotificationType;
  severity?: NotificationSeverity;
  source?: string;
  category?: string;
  read?: boolean;
  acknowledged?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: string;
}

export interface NotificationPreferences {
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationTypes: {
    [key in NotificationType]: boolean;
  };
  severityLevels: {
    [key in NotificationSeverity]: boolean;
  };
  sources: {
    [key: string]: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface NotificationTemplate {
  id?: number;
  name: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  source: string;
  category: string;
  variables?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  usageCount: number;
}

export interface NotificationAnalytics {
  totalNotifications: number;
  unreadCount: number;
  acknowledgedCount: number;
  byType: { [key in NotificationType]: number };
  bySeverity: { [key in NotificationSeverity]: number };
  bySource: { [key: string]: number };
  byCategory: { [key: string]: number };
  dailyVolume: DailyNotificationVolume[];
  responseTime: {
    average: number;
    bySeverity: { [key in NotificationSeverity]: number };
  };
}

export interface DailyNotificationVolume {
  date: string;
  total: number;
  unread: number;
  acknowledged: number;
  byType: { [key in NotificationType]: number };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = `${environment.apiUrls.apiGateway}`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Notification Management
  getNotifications(filters?: NotificationFilter): Observable<Notification[]> {
    let url = `${this.baseUrl}/notifications`;
    if (filters) {
      const params = this.buildFilterParams(filters);
      url += `?${params}`;
    }
    return this.http.get<Notification[]>(url);
  }

  getNotificationById(id: number): Observable<Notification> {
    return this.http.get<Notification>(`${this.baseUrl}/notifications/${id}`);
  }

  createNotification(notification: Notification): Observable<Notification> {
    return this.http.post<Notification>(`${this.baseUrl}/notifications`, notification);
  }

  updateNotification(id: number, notification: Partial<Notification>): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/notifications/${id}`, notification);
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notifications/${id}`);
  }

  // Notification Status Management
  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/notifications/mark-all-read`, {});
  }

  acknowledgeNotification(id: number, acknowledgedBy: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/notifications/${id}/acknowledge`, {
      acknowledgedBy
    });
  }

  acknowledgeAllNotifications(acknowledgedBy: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/notifications/acknowledge-all`, {
      acknowledgedBy
    });
  }

  // Notification Templates
  getNotificationTemplates(): Observable<NotificationTemplate[]> {
    return this.http.get<NotificationTemplate[]>(`${this.baseUrl}/notification-templates`);
  }

  getNotificationTemplateById(id: number): Observable<NotificationTemplate> {
    return this.http.get<NotificationTemplate>(`${this.baseUrl}/notification-templates/${id}`);
  }

  createNotificationTemplate(template: NotificationTemplate): Observable<NotificationTemplate> {
    return this.http.post<NotificationTemplate>(`${this.baseUrl}/notification-templates`, template);
  }

  updateNotificationTemplate(id: number, template: NotificationTemplate): Observable<NotificationTemplate> {
    return this.http.put<NotificationTemplate>(`${this.baseUrl}/notification-templates/${id}`, template);
  }

  deleteNotificationTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notification-templates/${id}`);
  }

  // Notification Preferences
  getNotificationPreferences(userId: number): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.baseUrl}/notification-preferences/${userId}`);
  }

  updateNotificationPreferences(userId: number, preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.baseUrl}/notification-preferences/${userId}`, preferences);
  }

  // Notification Analytics
  getNotificationAnalytics(period?: string): Observable<NotificationAnalytics> {
    let url = `${this.baseUrl}/notification-analytics`;
    if (period) {
      url += `?period=${period}`;
    }
    return this.http.get<NotificationAnalytics>(url);
  }

  getNotificationAnalyticsByDateRange(startDate: string, endDate: string): Observable<NotificationAnalytics> {
    return this.http.get<NotificationAnalytics>(`${this.baseUrl}/notification-analytics-range`, {
      params: { startDate, endDate }
    });
  }

  // System Notifications
  sendSystemNotification(notification: Notification): Observable<Notification> {
    return this.http.post<Notification>(`${this.baseUrl}/system-notifications`, notification);
  }

  sendBulkNotification(recipients: string[], notification: Notification): Observable<Notification[]> {
    return this.http.post<Notification[]>(`${this.baseUrl}/bulk-notifications`, {
      recipients,
      notification
    });
  }

  sendScheduledNotification(notification: Notification, scheduledTime: Date): Observable<Notification> {
    return this.http.post<Notification>(`${this.baseUrl}/scheduled-notifications`, {
      notification,
      scheduledTime
    });
  }

  // Notification Channels
  sendEmailNotification(notification: Notification, recipients: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/email-notifications`, {
      notification,
      recipients
    });
  }

  sendPushNotification(notification: Notification, recipients: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/push-notifications`, {
      notification,
      recipients
    });
  }

  sendSmsNotification(notification: Notification, recipients: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/sms-notifications`, {
      notification,
      recipients
    });
  }

  // Notification Rules and Automation
  createNotificationRule(rule: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/notification-rules`, rule);
  }

  getNotificationRules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/notification-rules`);
  }

  updateNotificationRule(id: number, rule: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/notification-rules/${id}`, rule);
  }

  deleteNotificationRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notification-rules/${id}`);
  }

  // Notification Export
  exportNotifications(format: 'csv' | 'pdf' | 'excel', filters?: NotificationFilter): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/export-notifications`, filters, { 
      responseType: 'blob' 
    });
  }

  // Real-time Updates
  subscribeToNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}/subscribe-notifications/${userId}`);
  }

  unsubscribeFromNotifications(subscriptionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/unsubscribe-notifications/${subscriptionId}`);
  }

  // Local State Management
  updateLocalNotifications(notifications: Notification[]): void {
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

  addLocalNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  updateLocalNotification(id: number, updates: Partial<Notification>): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === id ? { ...notification, ...updates } : notification
    );
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  removeLocalNotification(id: number): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(notification => notification.id !== id);
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(notification => !notification.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private buildFilterParams(filters: NotificationFilter): string {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.source) params.append('source', filters.source);
    if (filters.category) params.append('category', filters.category);
    if (filters.read !== undefined) params.append('read', filters.read.toString());
    if (filters.acknowledged !== undefined) params.append('acknowledged', filters.acknowledged.toString());
    if (filters.priority) params.append('priority', filters.priority);
    
    if (filters.dateRange) {
      params.append('startDate', filters.dateRange.start.toISOString());
      params.append('endDate', filters.dateRange.end.toISOString());
    }
    
    return params.toString();
  }

  // Utility Methods
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }
}
