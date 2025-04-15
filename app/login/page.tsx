"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(password)
      if (!success) {
        setError("Invalid password. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      <Card className="w-full max-w-md border border-border shadow-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Email Assistant</CardTitle>
          <CardDescription>Enter your password to access your emails</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
              {error && (
                <div className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-center text-muted-foreground">
          <p className="w-full">Protected email interface. Unauthorized access is prohibited.</p>
        </CardFooter>
      </Card>
    </div>
  )
} 