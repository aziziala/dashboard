import { ContactType } from './enums';

export interface SendTemplateRequest {
  waId: string;
  templateName: string;
  languageCode: string;
  contactType: ContactType;
  bodyParams?: string[];
}