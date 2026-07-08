import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewChecked
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { ChatWebSocketService } from '../../services/chat-websocket.service';
import { ChatStateService } from '../../services/chat-state.service';
import { ChatMessage, ContactType, Conversation, SendMessageRequest } from '../../models';
import { groupMessagesByDate, MessageGroup } from '../../utils/chat-date.util';
import { getAvatarColor, getInitials } from '../../utils/avatar.util';

/**
 * FLOW :
 *  - lit l'id de conversation depuis la route (réutilisé par Angular quand on
 *    clique d'une conversation à l'autre : on NE PEUT PAS se baser uniquement
 *    sur ngOnInit, il faut s'abonner à route.paramMap)
 *  - charge l'historique via ChatService.getMessages()
 *  - s'abonne en temps réel via ChatWebSocketService (nouveaux messages + statuts)
 *  - à l'envoi : ChatService.sendMessage() puis dédoublonnage par id avec
 *    le message qui arrivera de toute façon via le WebSocket
 */
@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  conversation: Conversation | null = null;
  messages: ChatMessage[] = [];
  loading = false;
  sending = false;
  errorMessage: string | null = null;

  private currentConversationId: string | null = null;
  private shouldScrollToBottom = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private chatWebSocketService: ChatWebSocketService,
    private chatStateService: ChatStateService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.route.paramMap.subscribe(params => {
        const conversationId = params.get('conversationId');
        if (conversationId) {
          this.openConversation(conversationId);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.currentConversationId) {
      this.chatWebSocketService.unsubscribeFromConversation(this.currentConversationId);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private openConversation(conversationId: string): void {
    if (this.currentConversationId === conversationId) {
      return;
    }
    if (this.currentConversationId) {
      this.chatWebSocketService.unsubscribeFromConversation(this.currentConversationId);
    }

    this.currentConversationId = conversationId;
    this.messages = [];
    this.errorMessage = null;
    this.conversation = this.chatStateService.getConversationById(conversationId) ?? null;
    this.chatStateService.setActiveConversation(conversationId);

    this.loadMessages(conversationId);
    this.listenRealtime(conversationId);
  }

  private loadMessages(conversationId: string): void {
    this.loading = true;
    this.chatService.getMessages(conversationId).subscribe({
      next: messages => {
        this.messages = messages;
        this.loading = false;
        this.shouldScrollToBottom = true;
      },
      error: err => {
        console.error('Erreur chargement des messages', err);
        this.loading = false;
        this.errorMessage = 'Impossible de charger les messages de cette conversation.';
      }
    });
  }

  private listenRealtime(conversationId: string): void {
    this.subscriptions.push(
      this.chatWebSocketService.subscribeToConversation(conversationId).subscribe(message => {
        this.upsertMessage(message);
        this.shouldScrollToBottom = true;
      })
    );
    this.subscriptions.push(
      this.chatWebSocketService.subscribeToConversationStatus(conversationId).subscribe(message => {
        this.upsertMessage(message);
      })
    );
  }

  /** Ajoute le message s'il est nouveau, ou met à jour son statut s'il existe déjà (dédoublonnage par id). */
  private upsertMessage(message: ChatMessage): void {
    const idx = this.messages.findIndex(m => m.id === message.id);
    if (idx === -1) {
      this.messages = [...this.messages, message];
    } else {
      const updated = [...this.messages];
      updated[idx] = message;
      this.messages = updated;
    }
  }

  get groupedMessages(): MessageGroup[] {
    return groupMessagesByDate(this.messages);
  }

  trackByMessageId(_index: number, message: ChatMessage): string {
    return message.id;
  }
  get headerName(): string {
    return this.conversation?.contactName?.trim() || this.conversation?.waId || '';
  }

  get headerInitials(): string {
    return getInitials(this.headerName);
  }

  get headerAvatarColor(): string {
    return getAvatarColor(this.conversation?.waId);
  }

  onSend(content: string): void {
    if (!this.conversation || !content.trim() || this.sending) {
      return;
    }

    this.sending = true;
    const request: SendMessageRequest = {
      waId: this.conversation.waId,
      content: content.trim(),
      // Le contact existe déjà à ce stade (la conversation est ouverte) :
      // ce champ ne sert qu'à la création initiale d'un contact côté backend.
      contactType: ContactType.AUTRE
    };

    this.chatService.sendMessage(request).subscribe({
      next: message => {
        this.upsertMessage(message);
        this.shouldScrollToBottom = true;
        this.sending = false;
      },
      error: err => {
        console.error("Erreur lors de l'envoi du message", err);
        this.errorMessage = "Échec de l'envoi du message. Vérifiez la fenêtre des 24h ou réessayez.";
        this.sending = false;
      }
    });
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}