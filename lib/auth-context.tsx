"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Get the password from the environment variable
// For client-side code, Next.js requires environment variables to be prefixed with NEXT_PUBLIC_
// However, we don't want to expose the password in client-side code
// So we'll use a fallback password for development. In production, configure this properly.
const APP_PASSWORD = process.env.APP_PASSWORD || "maksen26";

// Generate a random CSRF token
const generateCSRFToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  // Generate CSRF token on mount
  useEffect(() => {
    // Generate CSRF token
    const token = generateCSRFToken();
    setCsrfToken(token);
    
    // Store token in localStorage immediately
    localStorage.setItem("emailAppCSRF", token);
    
    // Check if user is authenticated
    const isAuth = localStorage.getItem("emailAppAuthToken") === "authenticated";
    setIsAuthenticated(isAuth);
    setIsLoading(false);

    // Redirect to login if not authenticated and not already on login page
    if (!isAuth && pathname !== "/login") {
      router.push("/login")
    }
    
    // Redirect to main page if authenticated and on login page
    if (isAuth && pathname === "/login") {
      router.push("/")
    }
  }, [pathname, router])

  const login = async (password: string): Promise<boolean> => {
    try {
      // Use server-side validation with CSRF protection
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ 
          password,
          csrf: csrfToken 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store auth token and CSRF token
        localStorage.setItem("emailAppAuthToken", "authenticated")
        localStorage.setItem("emailAppCSRF", csrfToken)
        setIsAuthenticated(true)
        router.push("/")
        return true
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }

  const logout = () => {
    localStorage.removeItem("emailAppAuthToken")
    localStorage.removeItem("emailAppCSRF")
    setIsAuthenticated(false)
    setCsrfToken(generateCSRFToken())
    router.push("/login")
  }

  // Show nothing while checking authentication
  if (isLoading) {
    return null
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 