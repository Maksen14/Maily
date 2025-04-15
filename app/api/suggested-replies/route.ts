// File: app/api/suggested-replies/route.ts
import { NextResponse } from "next/server"
import { getSuggestedReplies } from "@/lib/llm" // You'll build this

export async function POST(req: Request) {
  try {
    // Check for CSRF token
    const csrfHeader = req.headers.get("X-CSRF-Token");
    
    // Parse request body
    const { emailBody, userContext, csrf } = await req.json()
    
    // Validate CSRF token
    if (!csrfHeader || !csrf || csrfHeader !== csrf) {
      console.error("CSRF token validation failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    if (!emailBody) {
      return NextResponse.json({ error: "Email body is required" }, { status: 400 })
    }
    
    const suggestions = await getSuggestedReplies(emailBody, userContext)
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Error generating suggestions:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
