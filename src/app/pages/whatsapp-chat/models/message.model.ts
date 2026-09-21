import { ChatMessageStatus, MessageDirection } from './enums';

export interface WhatsAppMedia {
  mediaId?: string;
  mimeType?: string;
  objectKey?: string;
  fileName?: string;
  size?: number;
  sha256?: string;
  caption?: string;
  duration?: number;
  width?: number;
  height?: number;
  voice?: boolean;
  animated?: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface MediaUrlResponse {
  url: string;
  expiresInSeconds: number;
}

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
  media?: WhatsAppMedia;
}