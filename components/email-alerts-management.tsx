"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Mail, Plus, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"

interface EmailRecipient {
  id: number
  email: string
  name: string
  is_active: boolean
  created_at: string
}

interface EmailLog {
  id: number
  recipient_email: string
  subject: string
  status: string
  sent_at: string
  error_message?: string
}

export default function EmailAlertsManagement() {
  const [recipients, setRecipients] = useState<EmailRecipient[]>([])
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [testEmail, setTestEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Load recipients on component mount
  useEffect(() => {
    loadRecipients()
    loadEmailLogs()
  }, [])

  const loadRecipients = async () => {
    try {
      const response = await fetch("/api/email/recipients")
      const data = await response.json()

      if (data.success) {
        setRecipients(data.recipients || [])
      } else {
        setMessage({ type: "error", text: data.error || "Failed to load recipients" })
      }
    } catch (error) {
      console.error("Error loading recipients:", error)
      setMessage({ type: "error", text: "Network error loading recipients" })
    }
  }

  const loadEmailLogs = async () => {
    try {
      const response = await fetch("/api/email/logs")
      const data = await response.json()

      if (data.success) {
        setEmailLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Error loading email logs:", error)
    }
  }

  const addRecipient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newEmail.trim()) {
      setMessage({ type: "error", text: "Email address is required" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/email/recipients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          name: newName.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "Email recipient added successfully!" })
        setNewEmail("")
        setNewName("")
        loadRecipients() // Reload the list
      } else {
        setMessage({ type: "error", text: data.error || "Failed to add recipient" })
      }
    } catch (error) {
      console.error("Error adding recipient:", error)
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const removeRecipient = async (recipientId: number) => {
    if (!confirm("Are you sure you want to remove this recipient?")) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/email/recipients/${recipientId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: "Recipient removed successfully!" })
        loadRecipients() // Reload the list
      } else {
        setMessage({ type: "error", text: data.error || "Failed to remove recipient" })
      }
    } catch (error) {
      console.error("Error removing recipient:", error)
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!testEmail.trim()) {
      setMessage({ type: "error", text: "Test email address is required" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: "success", text: data.message || "Test email sent successfully!" })
        setTestEmail("")
        loadEmailLogs() // Reload logs to show the test email
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send test email" })
      }
    } catch (error) {
      console.error("Error sending test email:", error)
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Success
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Email Alert Management</h2>
      </div>

      {message && (
        <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          {message.type === "error" ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="recipients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="test">Test Email</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Email Recipient</CardTitle>
              <CardDescription>
                Add email addresses to receive energy consumption alerts and notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addRecipient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Adding..." : "Add Recipient"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Recipients ({recipients.length})</CardTitle>
              <CardDescription>Manage email addresses that will receive alert notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              {recipients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email recipients configured yet.</p>
                  <p className="text-sm">Add an email address above to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{recipient.email}</div>
                        {recipient.name && <div className="text-sm text-gray-600">{recipient.name}</div>}
                        <div className="text-xs text-gray-500">
                          Added: {new Date(recipient.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={recipient.is_active ? "default" : "secondary"}>
                          {recipient.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRecipient(recipient.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Send a test email to verify your SMTP configuration is working correctly. The system will use the Gmail
                credentials from your .env.local file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendTestEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Test Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-600">Enter any email address to receive the test email.</p>
                </div>
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  <Mail className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : "Send Test Email"}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📧 SMTP Configuration</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>Server:</strong> smtp.gmail.com:587
                  </p>
                  <p>
                    <strong>From:</strong> ashokumar3006@gmail.com
                  </p>
                  <p>
                    <strong>Security:</strong> TLS Enabled
                  </p>
                  <p className="text-xs mt-2 opacity-75">
                    Configuration is loaded from your .env.local file automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Sending History</CardTitle>
              <CardDescription>View the history of sent emails and their delivery status.</CardDescription>
            </CardHeader>
            <CardContent>
              {emailLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email logs available yet.</p>
                  <p className="text-sm">Send a test email to see logs here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(log.status)}
                          <span className="font-medium">{log.subject}</span>
                        </div>
                        <div className="text-sm text-gray-600">To: {log.recipient_email}</div>
                        <div className="text-xs text-gray-500">{new Date(log.sent_at).toLocaleString()}</div>
                        {log.error_message && (
                          <div className="text-xs text-red-600 mt-1">Error: {log.error_message}</div>
                        )}
                      </div>
                      <div>{getStatusBadge(log.status)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
