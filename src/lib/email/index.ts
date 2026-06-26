import { ResendEmailProvider } from "./resend-provider";
import type { EmailPayload, EmailProvider, EmailSendResult } from "./types";

class EmailService {
  constructor(private provider: EmailProvider) {}
  send(payload: EmailPayload): Promise<EmailSendResult> {
    return this.provider.send(payload);
  }
  setProvider(p: EmailProvider) {
    this.provider = p;
  }
}

export const emailService = new EmailService(new ResendEmailProvider());
export type { EmailPayload, EmailProvider, EmailSendResult, EmailTemplate } from "./types";
