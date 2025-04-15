import { NextResponse } from "next/server"
import { getUnreadEmailsFromGmail } from "@/lib/email"

export async function GET(req: Request) {
  try {
    // Check for CSRF token - make it optional for now to debug
    const csrfToken = req.headers.get("X-CSRF-Token");
    
    // In development, make CSRF validation optional
    // In production, you'd want to enforce this
    if (!csrfToken && process.env.NODE_ENV === 'production') {
      console.warn("No CSRF token provided in emails request");
      // In production, you might want to return an error
      // return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const emails = await getUnreadEmailsFromGmail(10)
    return NextResponse.json(emails)
  } catch (err: any) {
    console.error("Error fetching emails:", err)
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 })
  }
}
