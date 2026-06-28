// Vonage SMS API (natively supported by Supabase phone auth)
// Env vars: VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM (sender name or number)
const VONAGE_API_KEY = Deno.env.get("VONAGE_API_KEY") ?? "";
const VONAGE_API_SECRET = Deno.env.get("VONAGE_API_SECRET") ?? "";
const VONAGE_FROM = Deno.env.get("VONAGE_FROM") ?? "YURTA";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
    console.error("[send-sms-hook] Missing Vonage env vars");
    return new Response(JSON.stringify({ error: "SMS provider not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let phone: string;
  let otp: string;
  try {
    const body = await req.json();
    phone = body.phone;
    otp = body.otp;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!phone || !otp) {
    return new Response(JSON.stringify({ error: "phone and otp required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Strip leading + for Vonage (expects E.164 without +)
  const to = phone.replace(/^\+/, "");

  const response = await fetch("https://rest.nexmo.com/sms/json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: VONAGE_API_KEY,
      api_secret: VONAGE_API_SECRET,
      from: VONAGE_FROM,
      to,
      text: `YURTA: ваш код подтверждения ${otp}. Действителен 5 минут.`,
    }),
  });

  const result = await response.json().catch(() => ({}));
  const msg = result?.messages?.[0];

  if (!response.ok || msg?.status !== "0") {
    console.error("[send-sms-hook] Vonage error:", result);
    return new Response(JSON.stringify({ error: msg?.["error-text"] ?? "Failed to send SMS" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("{}", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
