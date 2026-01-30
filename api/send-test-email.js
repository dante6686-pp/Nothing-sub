// /api/send-test-email.js
const { Resend } = require("resend");

module.exports = async (req, res) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const to = (req.query.to || "").trim();
    if (!to) {
      return res.status(400).json({ ok: false, error: "Missing ?to=you@email.com" });
    }

    const result = await resend.emails.send({
      from: "Subscription to Nothing <onboarding@resend.dev>", // na start OK
      to,
      subject: "Your first nothing.",
      html: `<p>Nothing happened.</p><p>That’s the point.</p>`,
    });

    return res.status(200).json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
};
