import type { EmailPayload, EmailProvider, EmailSendResult } from "./types";

const DEFAULT_FROM = "YURTA <noreply@yurta.app>";

export class ResendEmailProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ??
      (typeof import.meta !== "undefined"
        ? (import.meta.env?.VITE_RESEND_API_KEY as string | undefined) ?? ""
        : "");
  }

  async send(payload: EmailPayload): Promise<EmailSendResult> {
    const from = payload.from ?? DEFAULT_FROM;

    if (!this.apiKey) {
      const stubId = `stub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      // eslint-disable-next-line no-console
      console.log("[email:stub]", { to: payload.to, subject: payload.subject, from, id: stubId });
      return { messageId: stubId, stub: true };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Resend ${res.status}: ${text}`);
    }
    const json = (await res.json()) as { id?: string };
    return { messageId: json.id ?? "unknown", stub: false };
  }
}
