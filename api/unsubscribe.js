// /api/unsubscribe.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) return res.status(500).send("Missing SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) return res.status(500).send("Missing SUPABASE_SERVICE_ROLE_KEY");

  const token = String(req.query?.t || "").trim();
  if (!token || token.length < 10) {
    return res.status(400).send("Invalid unsubscribe token");
  }

  try {
    // Najprościej: ustawiamy status na unsubscribed
    const url =
      `${SUPABASE_URL}/rest/v1/subscribers` +
      `?unsub_token=eq.${encodeURIComponent(token)}`;

    const sbResp = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        status: "unsubscribed",
        // opcjonalnie: plan = null
        // plan: null,
      }),
    });

    const text = await sbResp.text();
    if (!sbResp.ok) {
      return res.status(500).send(`Supabase error: ${text}`);
    }

    // Prosty “nice” ekran
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <!doctype html>
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Unsubscribed — Subscription to Nothing</title>
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#0b0c10;color:#e9e9ef;margin:0;display:grid;place-items:center;min-height:100vh}
        .card{max-width:520px;padding:24px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.04)}
        a{color:inherit}
      </style></head>
      <body>
        <div class="card">
          <h1 style="margin:0 0 8px">Done.</h1>
          <p style="margin:0 0 16px;opacity:.85">You will receive less nothing from now on.</p>
          <a href="/index.html">Back to home</a>
        </div>
      </body></html>
    `);
  } catch (e) {
    return res.status(500).send(String(e?.message || e));
  }
}
