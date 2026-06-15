import nodemailer from "nodemailer";

const host = process.env.EMAIL_SERVER_HOST;
const port = parseInt(process.env.EMAIL_SERVER_PORT || "587");
const user = process.env.EMAIL_SERVER_USER;
const pass = process.env.EMAIL_SERVER_PASSWORD;
const from = process.env.EMAIL_FROM || "noreply@sugamclinic.com";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log(`Sending email to ${to} with subject "${subject}"`);
  
  if (!host || !user || !pass) {
    console.warn("SMTP settings missing in .env.local. Email logged to console.");
    return { success: true, logged: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
