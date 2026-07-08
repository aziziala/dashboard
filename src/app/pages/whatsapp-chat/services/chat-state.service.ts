import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ChatService } from './chat.service';
import { ChatWebSocketService } from './chat-websocket.service';
import { ChatMessage, Conversation, MessageDirection } from '../models';

/**
 * Couche d'état "métier" du module chat : maintient la liste des conversations
 * à jour en combinant les appels REST initiaux et les évènements WebSocket
 * temps réel (nouveau message, changement de statut). Les composants ne
 * touchent jamais directement ChatWebSocketService : ils passent par ici.
 */
@Injectable({ providedIn: 'root' })
export class ChatStateService {

  private readonly conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  readonly conversations$: Observable<Conversation[]> = this.conversationsSubject.asObservable();

  private activeConversationId: string | null = null;
  private globalUpdatesSubscription?: Subscription;

  constructor(
    private chatService: ChatService,
    private chatWebSocketService: ChatWebSocketService
  ) {}

  /** À appeler une fois, à l'entrée dans le module chat (ChatLayoutComponent). */
  init(): void {
    this.chatWebSocketService.connect();
    this.loadConversations();
    this.globalUpdatesSubscription = this.chatWebSocketService.globalConversationUpdates$
      .subscribe(message => this.applyIncomingMessage(message));
  }

  /** À appeler en sortant du module chat (ChatLayoutComponent.ngOnDestroy). */
  destroy(): void {
    this.globalUpdatesSubscription?.unsubscribe();
    this.chatWebSocketService.disconnect();
    this.activeConversationId = null;
  }

  loadConversations(): void {
    this.chatService.getConversations().subscribe({
      next: list => this.conversationsSubject.next(this.sortByLastMessage(list)),
      error: err => console.error('Erreur chargement des conversations WhatsApp', err)
    });
  }

  getConversationById(conversationId: string): Conversation | undefined {
    return this.conversationsSubject.getValue().find(c => c.id === conversationId);
  }

  /**
   * Définit la conversation actuellement affichée à l'écran. Si elle a des
   * messages non lus, on les marque comme lus côté backend + on remet le
   * compteur local à zéro immédiatement (pas d'attente réseau pour l'UX).
   */
  setActiveConversation(conversationId: string | null): void {
    this.activeConversationId = conversationId;
    if (!conversationId) {
      return;
    }
    const conversation = this.getConversationById(conversationId);
    if (conversation && conversation.unreadCount > 0) {
      this.resetUnreadLocally(conversationId);
      this.chatService.markConversationAsRead(conversationId).subscribe({
        error: err => console.error('Erreur lors du marquage comme lu', err)
      });
    }
  }

  private resetUnreadLocally(conversationId: string): void {
    const list = this.conversationsSubject.getValue();
    const idx = list.findIndex(c => c.id === conversationId);
    if (idx === -1) {
      return;
    }
    const updated = [...list];
    updated[idx] = { ...updated[idx], unreadCount: 0 };
    this.conversationsSubject.next(updated);
  }

  private applyIncomingMessage(message: ChatMessage): void {
    const list = this.conversationsSubject.getValue();
    const idx = list.findIndex(c => c.id === message.conversationId);

    if (idx === -1) {
      // Conversation pas encore connue côté front (ex: nouveau contact qui
      // écrit pour la première fois) -> on recharge tout depuis l'API.
      this.loadConversations();
      return;
    }

    const updatedConversation: Conversation = {
      ...list[idx],
      lastMessage: message.content,
      lastMessageType: message.messageType,
      lastMessageAt: message.createdAt
    };

    if (message.direction === MessageDirection.IN && message.conversationId !== this.activeConversationId) {
      updatedConversation.unreadCount = (updatedConversation.unreadCount ?? 0) + 1;
    }

    const updatedList = [...list];
    updatedList[idx] = updatedConversation;
    this.conversationsSubject.next(this.sortByLastMessage(updatedList));
  }

  private sortByLastMessage(list: Conversation[]): Conversation[] {
    return [...list].sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
  }
}