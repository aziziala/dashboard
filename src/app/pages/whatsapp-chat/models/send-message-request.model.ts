import { ContactType } from './enums';

export interface SendMessageRequest {
  waId: string;
  content: string;
  contactType: ContactType;
  contactName?: string;
}