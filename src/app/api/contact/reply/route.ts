import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { sendEmail } from "@/lib/email";
import { renderEmail, quoteBlock, esc, nl2br } from "@/lib/emailTemplate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { id, subject, message } = await req.json();

    // --- Validation ---
    if (!id) {
      return NextResponse.json({ error: "Missing message ID" }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Reply message is required" }, { status: 400 });
    }

    const msg = await ContactMessage.findById(id);
    if (!msg) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (!msg.email || !EMAIL_RE.test(msg.email)) {
      return NextResponse.json(
        { error: "The recipient does not have a valid email address." },
        { status: 400 }
      );
    }

    const replySubject = (subject && subject.trim()) || `Re: ${msg.subject || "Your enquiry"}`;
    const adminName = (session.user as any).name || (session.user as any).email || "Admin";

    // --- Branded, responsive email (shared template) ---
    const originalRef =
      (msg.subject ? `<strong>Subject:</strong> ${esc(msg.subject)}<br/>` : "") +
      nl2br(msg.message);

    const html = renderEmail({
      title: "A reply from our team",
      previewText: `Reply from ${adminName}`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Dear ${esc(msg.name)},</p>
        <div>${nl2br(message)}</div>
        ${quoteBlock("Your original message", originalRef)}
        <p style="margin:16px 0 0;">Warm regards,<br/><strong>${esc(adminName)}</strong></p>
      `,
    });

    const result = await sendEmail({
      to: msg.email,
      subject: replySubject,
      html,
    });

    if (!result || result.success === false) {
      return NextResponse.json(
        { error: "Failed to send the reply email." },
        { status: 502 }
      );
    }

    // Persist reply + flip status to Replied.
    msg.replies.push({
      subject: replySubject,
      message: message.trim(),
      repliedBy: adminName,
    });
    msg.status = "Replied";
    await msg.save();

    return NextResponse.json({ success: true, message: msg });
  } catch (error: any) {
    console.error("Contact reply error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
