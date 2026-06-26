import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { EmailPayload, EmailSendResult } from "./email/types";

const DEFAULT_FROM = "YURTA <noreply@yurta.app>";

export const sendEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: EmailPayload) => data)
  .handler(async ({ data }): Promise<EmailSendResult> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      const stubId = `stub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      console.log("[email:stub]", { to: data.to, subject: data.subject });
      return { messageId: stubId, stub: true };
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: data.from ?? DEFAULT_FROM,
        to: [data.to],
        subject: data.subject,
        html: data.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Resend ${res.status}: ${text}`);
    }
    const json = (await res.json()) as { id?: string };
    return { messageId: json.id ?? "unknown", stub: false };
  });
