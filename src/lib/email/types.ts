export type EmailTemplate =
  | "welcome"
  | "new_offer"
  | "booking_confirmed"
  | "checkin_reminder"
  | "review_request"
  | "verification_status";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export type EmailSendResult = {
  messageId: string;
  stub: boolean;
};

export interface EmailProvider {
  send(payload: EmailPayload): Promise<EmailSendResult>;
}
