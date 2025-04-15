import { NextResponse } from "next/server"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  const { password } = await req.json()
  const hashed = await bcrypt.hash(password, 10)
  return NextResponse.json({ hash: hashed })
}
