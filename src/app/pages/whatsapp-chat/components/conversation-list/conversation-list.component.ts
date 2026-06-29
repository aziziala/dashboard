import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatStateService } from '../../services/chat-state.service';
import { Conversation } from '../../models';
import { getAvatarColor, getInitials } from '../../utils/avatar.util';

@Component({
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit, OnDestroy {

  private readonly searchTermSubject = new BehaviorSubject<string>('');
  filteredConversations$!: Observable<Conversation[]>;

  private subscriptions: Subscription[] = [];

  constructor(private chatStateService: ChatStateService) {}

  ngOnInit(): void {
    this.filteredConversations$ = combineLatest([
      this.chatStateService.conversations$,
      this.searchTermSubject.asObservable()
    ]).pipe(
      map(([conversations, term]) => this.filterConversations(conversations, term))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onSearchChange(term: string): void {
    this.searchTermSubject.next(term);
  }

  trackById(_index: number, conversation: Conversation): string {
    return conversation.id;
  }

  displayName(conversation: Conversation): string {
    return conversation.contactName?.trim() || conversation.waId;
  }

  initials(conversation: Conversation): string {
    return getInitials(this.displayName(conversation));
  }

  avatarColor(conversation: Conversation): string {
    return getAvatarColor(conversation.waId);
  }

  private filterConversations(conversations: Conversation[], term: string): Conversation[] {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return conversations;
    }
    return conversations.filter(conv =>
      this.displayName(conv).toLowerCase().includes(normalized) ||
      conv.waId.includes(normalized) ||
      (conv.lastMessage ?? '').toLowerCase().includes(normalized)
    );
  }
}