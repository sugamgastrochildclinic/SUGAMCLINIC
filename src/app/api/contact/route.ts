import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { connectToDatabase } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { sendEmail } from "@/lib/email";
import { renderEmail, infoTable, infoRow, quoteBlock, nl2br } from "@/lib/emailTemplate";
import { sanitizeHeader } from "@/lib/email";
import { rateLimit, getClientIp, normalizePhone, isHoneypotTripped } from "@/lib/rateLimit";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError, NotFound } from "@/lib/api/errors";
import { assertValidObjectId, parseBody } from "@/lib/api/validation";
import { contactStatusSchema } from "@/lib/api/schemas";

// Public enquiry input. `status` and `replies` are server-managed and must
// never be accepted from the public body (mass-assignment guard).
const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(20),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(1).max(4000),
});

export async function GET() {
  try {
    await requireAdmin();
    await connectToDatabase();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(messages);
  } catch (error) {
    return handleApiError(error, "GET /api/contact");
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();

    // Bot honeypot: silently accept and drop.
    if (isHoneypotTripped(raw)) {
      return NextResponse.json({ success: true });
    }

    // Per-IP flood guard before any DB work.
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`contact:ip:${ip}`, 5, 10 * 60 * 1000); // 5 / 10 min
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    await connectToDatabase();

    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid message details", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Per-phone guard: limit repeat submissions from one number.
    const phoneLimit = await rateLimit(`contact:phone:${normalizePhone(data.phone)}`, 4, 60 * 60 * 1000); // 4 / hr
    if (!phoneLimit.ok) {
      return NextResponse.json(
        { error: "You've sent several messages recently. Please wait a little before sending more." },
        { status: 429, headers: { "Retry-After": String(phoneLimit.retryAfterSec) } }
      );
    }

    const contactMsg = await ContactMessage.create(data);

    // Send email alert in the background via waitUntil so response is instant
    const clinicEmail = process.env.EMAIL_FROM || "info@sugamclinic.com";
    waitUntil(
      sendEmail({
        to: clinicEmail,
        subject: sanitizeHeader(`New Contact Form Message from ${data.name}`),
        html: renderEmail({
          title: "New website enquiry",
          previewText: `New message from ${data.name}`,
          bodyHtml: `
            <p style="margin:0 0 8px;">A new contact form message was submitted on the website.</p>
            ${infoTable(
              infoRow("Name", data.name) +
              infoRow("Phone", data.phone) +
              infoRow("Email", data.email) +
              (data.subject ? infoRow("Subject", data.subject) : "")
            )}
            ${quoteBlock("Message", nl2br(data.message))}
          `,
        }),
      }).catch(err => {
        console.error("Async contact email notification failed:", err);
      })
    );

    return NextResponse.json({ success: true, contactMsg });
  } catch (error) {
    return handleApiError(error, "POST /api/contact");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id, ...rest } = await req.json();
    assertValidObjectId(id, "message id");
    const { status } = parseBody(contactStatusSchema, rest);
    const contactMsg = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!contactMsg) throw NotFound("Message not found");
    return NextResponse.json(contactMsg);
  } catch (error) {
    return handleApiError(error, "PUT /api/contact");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const id = assertValidObjectId(new URL(req.url).searchParams.get("id"), "message id");
    await ContactMessage.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/contact");
  }
}
