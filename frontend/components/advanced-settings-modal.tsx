"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"

interface AdvancedSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Settings {
  company_name: string
  job_id: string
  job_title: string
  job_link: string
  email: string
  phone: string
}

export function AdvancedSettingsModal({ open, onOpenChange }: AdvancedSettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({
    company_name: "",
    job_id: "",
    job_title: "",
    job_link: "",
    email: "",
    phone: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createBrowserSupabaseClient()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (open && user) {
      fetchSettings()
    }
  }, [open, user])

  const fetchSettings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" error
        throw error
      }

      if (data) {
        setSettings(data)
      }
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Check if settings already exist
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .single()

      let error

      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase.from("user_settings").update(settings).eq("user_id", user.id)

        error = updateError
      } else {
        // Insert new settings
        const { error: insertError } = await supabase.from("user_settings").insert({
          ...settings,
          user_id: user.id,
        })

        error = insertError
      }

      if (error) {
        throw error
      }

      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      })

      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Advanced Settings</DialogTitle>
          <DialogDescription>
            Configure your company details and contact information for email templates.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
            </div>
            <div className="h-10 bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 bg-muted animate-pulse rounded-md"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
              <div className="h-10 bg-muted animate-pulse rounded-md"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={settings.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label htmlFor="job-id">Job ID</Label>
                <Input
                  id="job-id"
                  value={settings.job_id}
                  onChange={(e) => handleChange("job_id", e.target.value)}
                  placeholder="JOB-001"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                value={settings.job_title}
                onChange={(e) => handleChange("job_title", e.target.value)}
                placeholder="Senior Software Engineer"
              />
            </div>

            <div>
              <Label htmlFor="job-link">Job Link</Label>
              <Input
                id="job-link"
                value={settings.job_link}
                onChange={(e) => handleChange("job_link", e.target.value)}
                placeholder="https://company.com/jobs/123"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="your-email">Your Email</Label>
                <Input
                  id="your-email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="recruiter@company.com"
                />
              </div>
              <div>
                <Label htmlFor="your-phone">Your Phone</Label>
                <Input
                  id="your-phone"
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
