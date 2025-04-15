"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Mail, Send, User, Loader2, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import AuthWrapper from "./auth-wrapper"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define the Email type for better type checking.
interface Email {
  id: string
  from_email: string
  subject: string
  body: string
  received_at: string
}

function EmailDashboard() {
  // Auth context
  const { logout, isAuthenticated } = useAuth()
  
  // State variables
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [selectedReply, setSelectedReply] = useState<string | null>(null)
  const [editedReply, setEditedReply] = useState<string>("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [userContext, setUserContext] = useState<string>("")
  const { toast } = useToast()

  // ***************************************
  // *      Fetch Emails on Mount          *
  // ***************************************
  // Extract fetchEmails to a separate function so it can be reused
  const fetchEmails = async () => {
    try {
      setIsLoading(true)
      // Get CSRF token from localStorage
      const csrfToken = localStorage.getItem("emailAppCSRF");
      
      const response = await fetch("/api/emails", {
        headers: {
          "X-CSRF-Token": csrfToken || ""
        }
      })
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      const data = await response.json()
      setEmails(data)
      return data.length
    } catch (error) {
      console.error("Failed to fetch emails:", error)
      toast({
        title: "Error",
        description: "Failed to fetch emails. Please try again.",
        variant: "destructive",
      })
      return 0
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    async function loadEmailsOnMount() {
      const emailCount = await fetchEmails();
      if (emailCount > 0) {
        toast({
          title: "Emails loaded",
          description: `Successfully loaded ${emailCount} emails`,
        });
      }
    }
    loadEmailsOnMount();
  }, [toast])

  // *******************************************
  // *   Handlers for Email and Reply Actions  *
  // *******************************************

  // Handle selecting an email from the list.
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email)
    setSelectedReply(null)
    setEditedReply("")
    setSuggestions([])
    setUserContext("")
  }

  // Generate reply suggestions based on the selected email.
  const handleGenerateSuggestions = async () => {
    if (!selectedEmail) return
    setIsGenerating(true)
    try {
      const csrfToken = localStorage.getItem("emailAppCSRF") || "";
      
      const res = await fetch("/api/suggested-replies", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken 
        },
        body: JSON.stringify({ 
          emailBody: selectedEmail.body,
          userContext: userContext.trim(),
          csrf: csrfToken
        }),
      })
      if (!res.ok) throw new Error("Failed to generate suggestions")
      const generated = await res.json()
      setSuggestions(generated)
      toast({
        title: "Suggestions generated",
        description: `Generated ${generated.length} reply suggestions`,
      })
    } catch (error) {
      console.error("Error generating suggestions:", error)
      toast({
        title: "Error",
        description: "Could not generate suggestions",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // When the user selects a suggestion, set it as the current reply.
  const handleSelectReply = (reply: string) => {
    setSelectedReply(reply)
    setEditedReply(reply)
  }

  // Send the reply via the API.
  const handleSendReply = async () => {
    if (!selectedEmail || !editedReply) return
    setIsSending(true)
    try {
      const csrfToken = localStorage.getItem("emailAppCSRF") || "";
      
      const res = await fetch("/api/send-reply", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({
          to: selectedEmail.from_email,
          subject: "Re: " + selectedEmail.subject,
          text: editedReply,
          inReplyTo: selectedEmail.id,
          csrf: csrfToken
        }),
      })
      if (!res.ok) throw new Error("Failed to send reply")
      
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully.",
      })
      
      // Clear the current reply state
      setEditedReply("")
      setSelectedReply(null)
      setSuggestions([])
      
      // Refresh the email list to reflect changes
      setTimeout(async () => {
        await fetchEmails();
        // Optionally clear selected email to go back to inbox view
        setSelectedEmail(null);
      }, 500); // Small delay to allow server to process
      
    } catch (error) {
      console.error("Error sending reply:", error)
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex h-screen bg-background max-w-7xl mx-auto border-x border-border bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      {/* ******************************
       *   Left Panel: Email List   *
       ****************************** */}
      <div className="w-full md:w-1/3 border-r border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold">Inbox</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-65px)]">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading emails...</span>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-65px)]">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                  selectedEmail?.id === email.id ? "bg-accent" : ""
                }`}
                onClick={() => handleSelectEmail(email)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <User className="h-5 w-5" />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="font-medium truncate">{email.from_email}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {format(new Date(email.received_at), "h:mm a")}
                      </p>
                    </div>
                    <p className="font-medium text-sm truncate mb-0.5">{email.subject}</p>
                    <p className="text-sm text-muted-foreground truncate">{email.body}</p>
                  </div>
                </div>
              </div>
            ))}
            {emails.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
                <Mail className="h-10 w-10 text-muted-foreground opacity-20 mb-2" />
                <p className="text-muted-foreground">No emails found</p>
              </div>
            )}
          </ScrollArea>
        )}
      </div>

      {/* **************************************************
       *  Right Panel: Conversation Thread (Desktop)   *
       ************************************************** */}
      <div className="hidden md:flex md:w-2/3 flex-col">
        {selectedEmail ? (
          <>
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
              <p className="text-sm text-muted-foreground">
                From: {selectedEmail.from_email} •{" "}
                {format(new Date(selectedEmail.received_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <ScrollArea className="flex-1 p-4">
              {/* Email content */}
              <div className="flex gap-3 mb-6">
                <Avatar className="h-10 w-10 border border-border flex-shrink-0">
                  <User className="h-5 w-5" />
                </Avatar>
                <div className="flex-1">
                  <div className="bg-accent/50 p-4 rounded-lg border border-border shadow-sm">
                    <p className="leading-relaxed">{selectedEmail.body}</p>
                  </div>
                </div>
              </div>

              {/* Button to generate reply suggestions */}
              {suggestions.length === 0 && (
                <div className="mb-6 mt-2 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="context" className="text-sm font-medium">
                      Your context (optional)
                    </label>
                    <Textarea
                      id="context"
                      placeholder="Add personal context or tone for AI (e.g., 'Friendly tone', 'Can't attend, have a wedding')"
                      value={userContext}
                      onChange={(e) => setUserContext(e.target.value)}
                      className="min-h-[80px] p-3 border-border focus-visible:ring-primary"
                    />
                  </div>
                  <Button
                    onClick={handleGenerateSuggestions}
                    disabled={isGenerating}
                    className="w-full sm:w-auto"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating suggestions...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Generate Reply Suggestions
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Display the generated suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-primary">
                    <Mail className="h-4 w-4" />
                    Suggested Replies
                  </h3>
                  <div className="grid gap-3">
                    {suggestions.map((reply, index) => (
                      <div
                        key={index}
                        className="bg-background border border-border rounded-lg p-4 relative group shadow-sm hover:shadow transition-shadow"
                      >
                        <p className="text-sm pr-16 leading-relaxed">{reply}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute right-3 top-3 opacity-80 hover:opacity-100"
                          onClick={() => handleSelectReply(reply)}
                        >
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply editor */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium">Edit Your Reply</h3>
                <Textarea
                  value={editedReply}
                  onChange={(e) => setEditedReply(e.target.value)}
                  className="min-h-[150px] p-3 border-border focus-visible:ring-primary"
                  placeholder="Edit your reply..."
                />
                <div className="flex justify-end mt-3">
                  <Button onClick={handleSendReply} disabled={isSending || !editedReply.trim()} className="px-6">
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center p-6 bg-accent/30 rounded-lg border border-border max-w-md mx-auto">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-30 text-primary" />
              <h3 className="text-lg font-medium mb-2">Select an email</h3>
              <p className="text-sm">
                Choose an email from the list to view the conversation and generate AI-powered replies
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ************************************************
       *  Mobile View: Conversation Thread             *
       ************************************************ */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-background z-50 md:hidden">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold truncate">{selectedEmail.subject}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                Back
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="flex gap-3 mb-6">
                <Avatar className="h-10 w-10 border border-border flex-shrink-0">
                  <User className="h-5 w-5" />
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{selectedEmail.from_email}</p>
                  <div className="bg-accent/50 p-4 rounded-lg border border-border shadow-sm">
                    <p className="leading-relaxed">{selectedEmail.body}</p>
                  </div>
                </div>
              </div>

              {suggestions.length === 0 && (
                <div className="mb-6 mt-2 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="mobile-context" className="text-sm font-medium">
                      Your context (optional)
                    </label>
                    <Textarea
                      id="mobile-context"
                      placeholder="Add personal context or tone for AI (e.g., 'Friendly tone', 'Can't attend, have a wedding')"
                      value={userContext}
                      onChange={(e) => setUserContext(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <Button onClick={handleGenerateSuggestions} disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Generate Suggestions
                      </>
                    )}
                  </Button>
                </div>
              )}

              {suggestions.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Suggested Replies
                    </h3>
                    <div className="grid gap-2">
                      {suggestions.map((reply, index) => (
                        <div key={index} className="bg-background border border-border rounded-lg p-3 relative group">
                          <p className="text-sm pr-16">{reply}</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute right-2 top-2"
                            onClick={() => handleSelectReply(reply)}
                          >
                            Use
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium">Edit Your Reply</h3>
                <Textarea
                  value={editedReply}
                  onChange={(e) => setEditedReply(e.target.value)}
                  className="min-h-[120px]"
                  placeholder="Edit your reply..."
                />
                <div className="flex justify-end mt-3">
                  <Button onClick={handleSendReply} disabled={isSending || !editedReply.trim()} className="w-full">
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap the component with the AuthWrapper
export default function ProtectedEmailDashboard() {
  return (
    <AuthWrapper>
      <EmailDashboard />
    </AuthWrapper>
  )
}
