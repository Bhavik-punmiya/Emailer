"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface EmailSettings {
  id: string
  user_id: string
  email_host: string
  email_port: number
  email_user: string
  email_display_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const { user, supabase } = useAuth()
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email_host: "smtp.gmail.com",
    email_port: 587,
    email_user: "",
    email_password: "",
    email_display_name: "Bulk Email Sender"
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Please log in to access settings")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-settings`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          email_host: data.email_host || "smtp.gmail.com",
          email_port: data.email_port || 587,
          email_user: data.email_user || "",
          email_password: "", // Don't populate password for security
          email_display_name: data.email_display_name || "Bulk Email Sender"
        })
      } else if (response.status === 404) {
        // No settings found, use defaults
        setSettings(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to fetch settings")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email_user.trim()) {
      newErrors.email_user = "Email address is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_user)) {
      newErrors.email_user = "Please enter a valid email address"
    }

    if (!formData.email_password.trim()) {
      newErrors.email_password = "Password is required"
    }

    if (!formData.email_host.trim()) {
      newErrors.email_host = "SMTP host is required"
    }

    if (!formData.email_port || formData.email_port < 1 || formData.email_port > 65535) {
      newErrors.email_port = "Port must be between 1 and 65535"
    }

    if (!formData.email_display_name.trim()) {
      newErrors.email_display_name = "Display name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      setSaving(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Please log in to save settings")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        toast.success("Email settings saved successfully!")
        await fetchSettings() // Refresh the settings
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!validateForm()) return

    try {
      setTesting(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Please log in to test settings")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-settings/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Test email sent successfully! Check your inbox.")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Test failed")
      }
    } catch (error) {
      console.error("Error testing settings:", error)
      toast.error("Failed to test settings")
    } finally {
      setTesting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Settings</h1>
        <p className="text-muted-foreground">
          Configure your email provider settings to send bulk emails
        </p>
      </div>

      {settings && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Email settings are configured. You can now send bulk emails.
          </AlertDescription>
        </Alert>
      )}

      {!settings && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please configure your email settings before sending emails.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Configure your email provider's SMTP settings. For Gmail, you'll need to use an App Password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_host">SMTP Host</Label>
              <Input
                id="email_host"
                value={formData.email_host}
                onChange={(e) => handleInputChange("email_host", e.target.value)}
                placeholder="smtp.gmail.com"
                className={errors.email_host ? "border-red-500" : ""}
              />
              {errors.email_host && (
                <p className="text-sm text-red-500">{errors.email_host}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_port">SMTP Port</Label>
              <Input
                id="email_port"
                type="number"
                value={formData.email_port}
                onChange={(e) => handleInputChange("email_port", parseInt(e.target.value))}
                placeholder="587"
                className={errors.email_port ? "border-red-500" : ""}
              />
              {errors.email_port && (
                <p className="text-sm text-red-500">{errors.email_port}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_user">Email Address</Label>
            <Input
              id="email_user"
              type="email"
              value={formData.email_user}
              onChange={(e) => handleInputChange("email_user", e.target.value)}
              placeholder="your-email@gmail.com"
              className={errors.email_user ? "border-red-500" : ""}
            />
            {errors.email_user && (
              <p className="text-sm text-red-500">{errors.email_user}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_password">Password / App Password</Label>
            <div className="relative">
              <Input
                id="email_password"
                type={showPassword ? "text" : "password"}
                value={formData.email_password}
                onChange={(e) => handleInputChange("email_password", e.target.value)}
                placeholder="Enter your password or app password"
                className={errors.email_password ? "border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.email_password && (
              <p className="text-sm text-red-500">{errors.email_password}</p>
            )}
            <p className="text-sm text-muted-foreground">
              For Gmail, use an App Password instead of your regular password.{" "}
              <a
                href="https://support.google.com/accounts/answer/185833"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Learn how to create an App Password
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_display_name">Display Name</Label>
            <Input
              id="email_display_name"
              value={formData.email_display_name}
              onChange={(e) => handleInputChange("email_display_name", e.target.value)}
              placeholder="Your Name or Company"
              className={errors.email_display_name ? "border-red-500" : ""}
            />
            {errors.email_display_name && (
              <p className="text-sm text-red-500">{errors.email_display_name}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {settings ? "Update Settings" : "Save Settings"}
            </Button>
            
            <Button
              onClick={handleTest}
              disabled={testing || !formData.email_user || !formData.email_password}
              variant="outline"
              className="flex-1"
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {settings && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Configured
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{settings.email_user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">SMTP Server:</span>
                <span className="text-sm font-medium">{settings.email_host}:{settings.email_port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Display Name:</span>
                <span className="text-sm font-medium">{settings.email_display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Updated:</span>
                <span className="text-sm font-medium">
                  {new Date(settings.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 