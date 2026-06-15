import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { connectToDatabase } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { sendEmail } from "@/lib/email";
import { renderEmail, infoTable, infoRow, quoteBlock, nl2br } from "@/lib/emailTemplate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const contactMsg = await ContactMessage.create(data);

    // Send email alert in the background via waitUntil so response is instant
    const clinicEmail = process.env.EMAIL_FROM || "info@sugamclinic.com";
    waitUntil(
      sendEmail({
        to: clinicEmail,
        subject: `New Contact Form Message from ${data.name}`,
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();
    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const contactMsg = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
    return NextResponse.json(contactMsg);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing message ID" }, { status: 400 });
    }

    await ContactMessage.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
