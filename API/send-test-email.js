import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    const data = await resend.emails.send({
      from: "Nothing <onboarding@resend.dev>",
      to: ["dante6686@msn.com"], // <-- TU WPISZ SWOJ EMAIL
      subject: "You received nothing.",
      html: `
        <h2>Nothing delivered.</h2>
        <p>This email confirms that nothing has happened.</p>
        <p>Everything is proceeding as expected.</p>
        <p>— Subscription to Nothing</p>
      `,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
}
