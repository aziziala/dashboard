import { Component, Input } from '@angular/core';
import { ChatMessage, ChatMessageStatus, MessageDirection } from '../../models';

@Component({
  selector: 'app-message-bubble',
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent {

  @Input() message!: ChatMessage;

  readonly MessageDirection = MessageDirection;
  readonly ChatMessageStatus = ChatMessageStatus;

  get isOutgoing(): boolean {
    return this.message.direction === MessageDirection.OUT;
  }

  /** Icône de statut façon WhatsApp, affichée uniquement sur les messages sortants. */
  get statusIcon(): string {
    switch (this.message.status) {
      case ChatMessageStatus.PENDING:
        return '🕓';
      case ChatMessageStatus.SENT:
        return '✓';
      case ChatMessageStatus.DELIVERED:
        return '✓✓';
      case ChatMessageStatus.READ:
        return '✓✓';
      case ChatMessageStatus.FAILED:
        return '⚠';
      default:
        return '';
    }
  }

  get statusClass(): string {
    return 'wa-bubble__status--' + this.message.status.toLowerCase();
  }
}