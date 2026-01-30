// /api/send-test-email.js

module.exports = async (req, res) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ ok: false, error: "Missing RESEND_API_KEY" });

    const to = String(req.query.to || "").trim();
    if (!to) return res.status(400).json({ ok: false, error: "Missing ?to=you@email.com" });

    const payload = {
      from: "Subscription to Nothing <onboarding@resend.dev>", // na start OK
      to,
      subject: "Your first nothing.",
      html: "<p>Nothing happened.</p><p>That’s the point.</p>",
    };

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return res.status(500).json({ ok: false, status: r.status, data });
    }

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
};
