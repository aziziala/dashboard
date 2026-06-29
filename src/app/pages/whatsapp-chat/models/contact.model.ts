import { ContactType } from './enums';

export interface Contact {
  id: string;
  waId: string;
  name: string;
  userId?: string;
  type: ContactType;
  createdAt?: string;
}