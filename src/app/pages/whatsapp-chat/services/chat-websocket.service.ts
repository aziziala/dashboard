
import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChatMessage } from '../models';

/**
 * Gère uniquement la connexion STOMP/SockJS et l'abonnement/désabonnement
 * aux topics du backend. Aucune logique métier (compteurs non-lus, tri...) :
 * c'est ChatStateService qui s'en occupe en consommant les Observables exposés ici.
 *
 * Topics backend consommés :
 *   /topic/conversations                       -> tout nouveau message, toutes conversations
 *   /topic/conversation/{conversationId}        -> messages d'une conversation ouverte
 *   /topic/conversation/{conversationId}/status -> mises à jour de statut (sent/delivered/read)
 */
@Injectable({ providedIn: 'root' })
export class ChatWebSocketService {

  private client?: Client;

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly globalUpdatesSubject = new Subject<ChatMessage>();

  private readonly conversationSubjects = new Map<string, Subject<ChatMessage>>();
  private readonly statusSubjects = new Map<string, Subject<ChatMessage>>();
  private readonly activeSubscriptions = new Map<string, StompSubscription>();

  get connectionStatus$(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  /** Flux global : reçoit un ChatMessage à chaque nouveau message (IN ou OUT), toutes conversations confondues. */
  get globalConversationUpdates$(): Observable<ChatMessage> {
    return this.globalUpdatesSubject.asObservable();
  }

  connect(): void {
    if (this.client?.active) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.whatsappWsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    });

    this.client.onConnect = () => {
      this.connectedSubject.next(true);
      this.subscribeGlobalTopic();
      // Re-souscrit aux conversations déjà demandées avant une coupure/reconnexion.
      this.conversationSubjects.forEach((_, conversationId) => this.ensureConversationSubscribed(conversationId));
    };

    this.client.onWebSocketClose = () => this.connectedSubject.next(false);
    this.client.onStompError = (frame) => console.error('Erreur STOMP whatsapp-service :', frame.headers, frame.body);

    this.client.activate();
  }

  disconnect(): void {
    this.activeSubscriptions.forEach(sub => sub.unsubscribe());
    this.activeSubscriptions.clear();
    this.conversationSubjects.clear();
    this.statusSubjects.clear();
    this.client?.deactivate();
    this.connectedSubject.next(false);
  }

  private subscribeGlobalTopic(): void {
    if (!this.client) {
      return;
    }
    const sub = this.client.subscribe('/topic/conversations', (frame: IMessage) => {
      this.globalUpdatesSubject.next(JSON.parse(frame.body) as ChatMessage);
    });
    this.activeSubscriptions.set('global', sub);
  }

  /** Renvoie (et crée si besoin) le flux des messages d'une conversation précise. */
  subscribeToConversation(conversationId: string): Observable<ChatMessage> {
    if (!this.conversationSubjects.has(conversationId)) {
      this.conversationSubjects.set(conversationId, new Subject<ChatMessage>());
    }
    this.ensureConversationSubscribed(conversationId);
    return this.conversationSubjects.get(conversationId)!.asObservable();
  }

  /** Renvoie (et crée si besoin) le flux des mises à jour de statut d'une conversation précise. */
  subscribeToConversationStatus(conversationId: string): Observable<ChatMessage> {
    if (!this.statusSubjects.has(conversationId)) {
      this.statusSubjects.set(conversationId, new Subject<ChatMessage>());
    }
    this.ensureConversationSubscribed(conversationId);
    return this.statusSubjects.get(conversationId)!.asObservable();
  }

  private ensureConversationSubscribed(conversationId: string): void {
    if (!this.client?.connected) {
      return; // sera (re)fait dans onConnect dès que la connexion est active
    }

    const messagesKey = `conv:${conversationId}`;
    if (!this.activeSubscriptions.has(messagesKey)) {
      const sub = this.client.subscribe(`/topic/conversation/${conversationId}`, (frame: IMessage) => {
        this.conversationSubjects.get(conversationId)?.next(JSON.parse(frame.body) as ChatMessage);
      });
      this.activeSubscriptions.set(messagesKey, sub);
    }

    const statusKey = `status:${conversationId}`;
    if (!this.activeSubscriptions.has(statusKey)) {
      const sub = this.client.subscribe(`/topic/conversation/${conversationId}/status`, (frame: IMessage) => {
        this.statusSubjects.get(conversationId)?.next(JSON.parse(frame.body) as ChatMessage);
      });
      this.activeSubscriptions.set(statusKey, sub);
    }
  }

  /** Libère les abonnements liés à une conversation quand elle n'est plus affichée. */
  unsubscribeFromConversation(conversationId: string): void {
    this.activeSubscriptions.get(`conv:${conversationId}`)?.unsubscribe();
    this.activeSubscriptions.get(`status:${conversationId}`)?.unsubscribe();
    this.activeSubscriptions.delete(`conv:${conversationId}`);
    this.activeSubscriptions.delete(`status:${conversationId}`);
    this.conversationSubjects.delete(conversationId);
    this.statusSubjects.delete(conversationId);
  }
}