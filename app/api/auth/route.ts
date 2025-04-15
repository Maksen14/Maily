import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { comparePassword } from "@/lib/auth-utils"

export async function POST(req: Request) {
  try {
    console.log("=== AUTH API CALLED ===")

    // Get IP for rate limiting (fallback to a default in development)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "localhost"
    console.log("Client IP:", ip)

    // Apply rate limiting
    const rateLimitResult = rateLimit(ip)

    // If rate limited, return 429 Too Many Requests
    if (rateLimitResult.isRateLimited) {
      console.log("Rate limit exceeded for IP:", ip)
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts",
          resetIn: rateLimitResult.resetIn,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.resetIn.toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetIn.toString(),
          },
        }
      )
    }

    // Get CSRF token from header
    const csrfHeader = req.headers.get("X-CSRF-Token")
    console.log("CSRF token from header:", csrfHeader ? csrfHeader.substring(0, 10) + "..." : "undefined")

    // Parse request body
    const { password, csrf } = await req.json()
    console.log("Password length:", password ? password.length : 0)

    // Validate CSRF token
    if (!csrfHeader || !csrf || csrfHeader !== csrf) {
      console.error("CSRF token validation failed")
      return NextResponse.json({ success: false, error: "Invalid security token" }, { status: 403 })
    }

    console.log("CSRF validation passed")

    // Get the plaintext password from environment variables
    const storedPassword = process.env.APP_PASSWORD

    if (!storedPassword) {
      console.error("APP_PASSWORD not set in environment variables")
      return NextResponse.json({
        success: false,
        error: "Server configuration error",
      }, { status: 500 })
    }

    console.log("Retrieved stored password from env (length):", storedPassword.length)

    // Compare the submitted password with the stored password
    const isValid = comparePassword(password, storedPassword)

    // For debugging - remove in production
    console.log("Password comparison result:", isValid)

    // Return rate limit headers even on successful login
    const responseHeaders = {
      "X-RateLimit-Limit": rateLimitResult.limit.toString(),
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": rateLimitResult.resetIn.toString(),
    }

    console.log("Login attempt result:", isValid ? "SUCCESS" : "FAILURE")

    return NextResponse.json({ success: isValid }, { headers: responseHeaders })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({
      success: false,
      error: "Authentication failed",
    }, { status: 500 })
  }
}
