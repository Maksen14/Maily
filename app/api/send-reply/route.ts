import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    // Check for CSRF token
    const csrfHeader = req.headers.get("X-CSRF-Token");
    
    // Parse request body
    const { to, subject, text, inReplyTo, csrf } = await req.json()
    
    // Validate CSRF token
    if (!csrfHeader || !csrf || csrfHeader !== csrf) {
      console.error("CSRF token validation failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Send email
    await sendEmail({ to, subject, text, inReplyTo })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Error sending reply:", err)
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 })
  }
}
