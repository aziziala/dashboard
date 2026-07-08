import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChatMessage, Conversation, SendMessageRequest, SendTemplateRequest } from '../models';

/**
 * Consomme l'API REST exposée par le microservice whatsapp-service
 * (ChatController côté backend). Aucune logique métier ici : uniquement
 * des appels HTTP. La logique de state/temps réel vit dans ChatStateService.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {

  private readonly baseUrl = `${environment.whatsappApiUrl}/chat`;

  constructor(private http: HttpClient) {}

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations`);
  }

  getMessages(conversationId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/conversations/${conversationId}/messages`);
  }

  sendMessage(request: SendMessageRequest): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/send`, request);
  }

  sendTemplate(request: SendTemplateRequest): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/send-template`, request);
  }

  markConversationAsRead(conversationId: string): Observable<Conversation> {
    return this.http.patch<Conversation>(`${this.baseUrl}/conversations/${conversationId}/read`, {});
  }
}