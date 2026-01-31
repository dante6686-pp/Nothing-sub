// /api/send-monthly-nothing.js

export default async function handler(req, res) {
  // 0) allow only GET/POST
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // 1) SECRET GUARD (query) => /api/send-monthly-nothing?secret=XXXX
  const secret = String(req.query?.secret || "");
  const expected = String(process.env.CRON_SECRET || "");

  if (!expected) {
    return res.status(500).json({ ok: false, error: "Missing CRON_SECRET env var" });
  }
  if (secret !== expected) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // 2) env
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Missing RESEND_API_KEY" });
  if (!SUPABASE_URL) return res.status(500).json({ ok: false, error: "Missing SUPABASE_URL" });
  if (!SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" });

  // 3) options
  const dryRun = String(req.query?.dry || "") === "1";   // ?dry=1 -> no sending
  const limit = clampInt(req.query?.limit, 1, 500, 200); // ?limit=50 (default 200)

  // 4) base url for links (unsubscribe)
  const proto = String(req.headers["x-forwarded-proto"] || "https");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "getnothing.win");
  const baseUrl = `${proto}://${host}`;

  try {
    // 5) pull active subscribers (Supabase REST)
    const sbUrl =
      `${SUPABASE_URL}/rest/v1/subscribers` +
      `?select=email,plan,status,unsub_token` +
      `&status=eq.active` +
      `&limit=${limit}`;

    const sbResp = await fetch(sbUrl, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    const sbText = await sbResp.text();
    let subscribers;
    try {
      subscribers = sbText ? JSON.parse(sbText) : [];
    } catch {
      subscribers = null;
    }

    if (!sbResp.ok) {
      return res.status(500).json({
        ok: false,
        error: "Supabase fetch failed",
        status: sbResp.status,
        details: subscribers ?? sbText,
      });
    }

    if (!Array.isArray(subscribers)) {
      return res.status(500).json({
        ok: false,
        error: "Supabase returned non-array",
        details: subscribers ?? sbText,
      });
    }

    // 6) send loop
    const results = [];
    for (const s of subscribers) {
      const to = String(s?.email || "").trim();
      const plan = String(s?.plan || "basic").toLowerCase();

      if (!to || !to.includes("@")) {
        results.push({ to, ok: false, status: 400, id: null, error: "Invalid email" });
        continue;
      }

      const subject =
        plan === "premium"
          ? "Your Premium Nothing has arrived."
          : plan === "founder"
          ? "Founder Nothing (still nothing)."
          : "Your monthly nothing is here.";

      const safePlan = escapeHtml(plan);

      // unsubscribe link (1-click) if you have unsub_token
      const token = String(s?.unsub_token || "");
      const unsubUrl = token
        ? `${baseUrl}/api/unsubscribe?t=${encodeURIComponent(token)}`
        : null;

      const unsubLine = unsubUrl
        ? `<p style="margin:0;opacity:.7">Unsubscribe: <a href="${unsubUrl}" style="color:inherit">one click</a></p>`
        : `<p style="margin:0;opacity:.7">Unsubscribe? You can cancel in PayPal.</p>`;

      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.5">
          <h2 style="margin:0 0 12px">Nothing Update</h2>
          <p style="margin:0 0 12px">This is your scheduled delivery of <b>nothing</b>.</p>
          <p style="margin:0 0 12px;opacity:.75">Plan: ${safePlan}</p>
          <hr style="border:none;border-top:1px solid rgba(0,0,0,.08);margin:16px 0"/>
          ${unsubLine}
        </div>
      `;

      if (dryRun) {
        results.push({ to, ok: true, status: 200, id: "dry-run", error: null });
        continue;
      }

      const sendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Subscription to Nothing <hello@getnothing.win>",
          to,
          subject,
          html,
        }),
      });

      const sendText = await sendResp.text();
      let sendJson;
      try {
        sendJson = sendText ? JSON.parse(sendText) : {};
      } catch {
        sendJson = { raw: sendText };
      }

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
      dryRun,
      total: results.length,
      sent,
      failed,
      results,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}

// helpers
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
