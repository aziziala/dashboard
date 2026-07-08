export interface Conversation {
  id: string;
  contactId: string;
  waId: string;
  contactName?: string;
  lastMessage?: string;
  lastMessageType?: string;
  lastMessageAt?: string;
  unreadCount: number;
}