import { ChatMessageStatus, MessageDirection } from './enums';

export interface ChatMessage {
  id: string;
  conversationId: string;
  whatsappMessageId?: string;
  direction: MessageDirection;
  messageType: string;
  content: string;
  status: ChatMessageStatus;
  phoneNumber: string;
  createdAt: string;
  updatedAt?: string;
}