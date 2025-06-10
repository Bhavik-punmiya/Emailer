"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { apiService, EmailSettings } from "@/lib/api"

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  
  const [formData, setFormData] = useState({
    email_host: "smtp.gmail.com",
    email_port: 587,
    email_user: "",
    email_password: "",
    email_display_name: "Bulk Email Sender"
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Settings: User not authenticated, redirecting to login")
      router.replace("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      console.log('Fetching email settings...')
      const data = await apiService.getEmailSettings()
      console.log('Email settings fetched successfully:', data)
      setSettings(data)
      setFormData({
        email_host: data.email_host || "smtp.gmail.com",
        email_port: data.email_port || 587,
        email_user: data.email_user || "",
        email_password: "", // Don't populate password for security
        email_display_name: data.email_display_name || "Bulk Email Sender"
      })
    } catch (error: any) {
      console.error("Error fetching settings:", error)
      if (error.message.includes('404') || error.message.includes('No email settings found')) {
        // No settings found, use defaults
        console.log('No email settings found, using defaults')
        setSettings(null)
      } else if (error.message.includes('401') || error.message.includes('Invalid authentication')) {
        toast.error("Please log in to access email settings")
        router.push('/login')
      } else {
        toast.error(`Failed to fetch settings: ${error.message}`)
      }
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
      console.log('Saving email settings...', formData)
      const data = await apiService.saveEmailSettings(formData)
      console.log('Email settings saved successfully:', data)
      setSettings(data)
      toast.success("Email settings saved successfully!")
      await fetchSettings() // Refresh the settings
    } catch (error: any) {
      console.error("Error saving settings:", error)
      if (error.message.includes('401') || error.message.includes('Invalid authentication')) {
        toast.error("Please log in to save email settings")
        router.push('/login')
      } else {
        toast.error(`Failed to save settings: ${error.message}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!validateForm()) return

    try {
      setTesting(true)
      console.log('Testing email settings...', formData)
      await apiService.testEmailSettings(formData)
      console.log('Email settings test successful')
      toast.success("Test email sent successfully! Check your inbox.")
    } catch (error: any) {
      console.error("Error testing settings:", error)
      if (error.message.includes('401') || error.message.includes('Invalid authentication')) {
        toast.error("Please log in to test email settings")
        router.push('/login')
      } else {
        toast.error(`Test failed: ${error.message}`)
      }
    } finally {
      setTesting(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true)
      console.log('Testing API connection...')
      const result = await apiService.testAuth()
      console.log('API connection test successful:', result)
      toast.success("API connection successful!")
    } catch (error: any) {
      console.error("API connection test failed:", error)
      toast.error(`API connection failed: ${error.message}`)
    } finally {
      setTestingConnection(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the main content if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Email Settings</h1>
                <p className="text-muted-foreground">
                  Configure your email provider settings to send bulk emails
                </p>
              </div>

              {settings && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Email settings are configured. You can now send bulk emails.
                  </AlertDescription>
                </Alert>
              )}

              {!settings && (
                <Alert>
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
                <Card>
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

              {/* Debug Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                  <CardDescription>
                    Technical information to help troubleshoot API issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Base URL:</span>
                        <span className="font-mono">{process.env.NEXT_PUBLIC_API_URL || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User Authenticated:</span>
                        <span className={user ? "text-green-600" : "text-red-600"}>
                          {user ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID:</span>
                        <span className="font-mono">{user?.id || "Not available"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Settings Status:</span>
                        <span className={settings ? "text-green-600" : "text-yellow-600"}>
                          {settings ? "Configured" : "Not configured"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {testingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Test API Connection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 