import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // IMPORTANT
);

export default async function handler(req, res) {
  // security: tylko cron
  if (req.headers["x-vercel-cron"] !== "1") {
    return res.status(401).json({ error: "Not allowed" });
  }

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email, plan")
    .eq("status", "active");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  let sent = 0;

  for (const sub of subscribers) {
    const subject =
      sub.plan === "premium"
        ? "Your premium nothing has arrived"
        : "Your monthly nothing";

    const html = `
      <div style="font-family: system-ui; padding:40px; text-align:center;">
        <h1>Nothing.</h1>
        <p>This email intentionally contains nothing.</p>
        <p style="opacity:.4; margin-top:40px;">
          Subscription to Nothing™
        </p>
      </div>
    `;

    await resend.emails.send({
      from: "Nothing <nothing@your-domain-or-resend.dev>",
      to: sub.email,
      subject,
      html,
    });

    sent++;
  }

  res.json({ ok: true, sent });
}
