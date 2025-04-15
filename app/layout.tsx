import "./globals.css"
import { Inter } from "next/font/google"
import { ToastProvider } from "@/components/ui/toast"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Email Assistant",
  description: "AI-powered email assistant with suggested replies",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
