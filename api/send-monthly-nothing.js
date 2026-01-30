import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    // 1) env sanity check
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Missing RESEND_API_KEY" });
    if (!SUPABASE_URL) return res.status(500).json({ ok: false, error: "Missing SUPABASE_URL" });
    if (!SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" });

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2) (opcjonalnie) tylko cron – na czas testów możesz to wyłączyć
    // jeśli chcesz testować ręcznie w przeglądarce, zakomentuj to:
    // if (req.headers["x-vercel-cron"] !== "1") return res.status(401).json({ ok:false, error:"Not allowed" });

    // 3) pobierz subów
    const { data: subs, error } = await supabase
      .from("subscribers")
      .select("email, plan")
      .eq("status", "active");

    if (error) return res.status(500).json({ ok: false, error: error.message });

    // 4) allowlist testowa (bo Resend bez domeny = tylko twój mail)
    const testTo = (process.env.RESEND_TEST_TO || "").trim().toLowerCase();
    const list = (subs || []).filter(s => s?.email);

    const targets = testTo
      ? list.filter(s => String(s.email).toLowerCase() === testTo)
      : list;

    // 5) wysyłka z raportem błędów (NIE crashuje)
    let sent = 0;
    const failures = [];

    for (const s of targets) {
      const subject = s.plan === "premium"
        ? "Your premium nothing has arrived"
        : "Your monthly nothing";

      const html = `
        <div style="font-family:system-ui;padding:40px;text-align:center">
          <h1>Nothing.</h1>
          <p>This email intentionally contains nothing.</p>
          <p style="opacity:.4;margin-top:40px">Subscription to Nothing™</p>
        </div>
      `;

      try {
        const r = await resend.emails.send({
          from: "Nothing <onboarding@resend.dev>",  // testowo OK
          to: s.email,
          subject,
          html,
        });

        // Resend czasem zwraca error w polu, nie jako throw
        if (r?.error) {
          failures.push({ email: s.email, error: r.error });
        } else {
          sent++;
        }
      } catch (e) {
        failures.push({ email: s.email, error: String(e?.message || e) });
      }
    }

    return res.json({ ok: true, total: targets.length, sent, failures });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
