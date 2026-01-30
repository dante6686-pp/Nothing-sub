export default async function handler(req, res) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Missing RESEND_API_KEY" });
    if (!SUPABASE_URL) return res.status(500).json({ ok: false, error: "Missing SUPABASE_URL" });
    if (!SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" });

    // 1) Pobierz aktywnych subskrybentów z Supabase REST
    const sbUrl =
      `${SUPABASE_URL}/rest/v1/subscribers?select=email,plan,status&status=eq.active`;

    const sbResp = await fetch(sbUrl, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    const subscribers = await sbResp.json();
    if (!sbResp.ok) {
      return res.status(500).json({ ok: false, error: "Supabase fetch failed", details: subscribers });
    }

    // 2) Wyślij "nic" do każdego
    const results = [];
    for (const s of subscribers) {
      const to = s.email;
      const plan = s.plan || "basic";

      const subject =
        plan === "premium" ? "Your Premium Nothing has arrived." : "Your monthly nothing is here.";

      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.5">
          <h2 style="margin:0 0 12px">Nothing Update</h2>
          <p style="margin:0 0 12px">This is your scheduled delivery of <b>nothing</b>.</p>
          <p style="margin:0 0 12px;opacity:.75">Plan: ${escapeHtml(plan)}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p style="margin:0;opacity:.7">Unsubscribe? You can cancel in PayPal.</p>
        </div>
      `;

      const sendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // na trialu Resend i tak musisz używać ich domeny / zweryfikowanej domeny
          from: "onboarding@resend.dev",
          to,
          subject,
          html,
        }),
      });

      const sendJson = await sendResp.json();
      results.push({
        to,
        ok: sendResp.ok,
        status: sendResp.status,
        id: sendJson?.id || null,
        error: sendResp.ok ? null : sendJson,
      });
    }

    const sent = results.filter(r => r.ok).length;
    const failed = results.length - sent;

    return res.status(200).json({
      ok: true,
      total: results.length,
      sent,
      failed,
      results,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
