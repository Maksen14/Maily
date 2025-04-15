import bcrypt from "bcrypt"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { password } = await req.json()

  const referencePassword = "maksen26"
  const hash = await bcrypt.hash(referencePassword, 10)
  const isValid = await bcrypt.compare(password, hash)

  return NextResponse.json({
    input: password,
    reference: referencePassword,
    hash,
    isValid,
  })
}
