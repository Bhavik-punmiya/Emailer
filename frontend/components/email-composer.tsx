"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, Save, Send, Settings, Eye } from "lucide-react"
import { AdvancedSettingsModal } from "@/components/advanced-settings-modal"
import { PreviewModal } from "@/components/preview-modal"
import { SendEmailModal } from "@/components/send-email-modal"
import { RichTextEditor } from "@/components/rich-text-editor"
import { FileUpload } from "@/components/file-upload"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { apiService, Contact, EmailTemplate, FileAttachment } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EmailComposerProps {
  selectedTemplate: any
  onTemplateChange: (template: any) => void
}

export function EmailComposer({ selectedTemplate, onTemplateChange }: EmailComposerProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [subject, setSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserSupabaseClient()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (selectedTemplate) {
      setSubject(selectedTemplate.subject || "")
      setEmailBody(selectedTemplate.body || "")
      setTemplateName(selectedTemplate.name || "")
      setAttachments(selectedTemplate.attachments || [])
    }
  }, [selectedTemplate])

  useEffect(() => {
    if (user) {
      fetchContacts()
    }
  }, [user])

  const fetchContacts = async () => {
    if (!user) return

    setIsLoadingContacts(true)
    try {
      const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setContacts((data || []) as unknown as Contact[])
    } catch (error: any) {
      toast({
        title: "Error loading contacts",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    if (file.type === "text/csv") {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const csv = e.target?.result as string
        const lines = csv.split("\n")
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

        const nameIndex = headers.findIndex((h) => h.includes("name"))
        const emailIndex = headers.findIndex((h) => h.includes("email"))

        if (nameIndex === -1 || emailIndex === -1) {
          toast({
            title: "Invalid CSV format",
            description: "CSV must contain Name and Email columns",
            variant: "destructive",
          })
          return
        }

        const parsedContacts: Contact[] = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",")
          if (values.length >= 2) {
            const name = values[nameIndex]?.trim() || ""
            const email = values[emailIndex]?.trim() || ""

            if (name && email) {
              parsedContacts.push({ name, email })
            }
          }
        }

        if (parsedContacts.length === 0) {
          toast({
            title: "No valid contacts found",
            description: "The CSV file doesn't contain any valid contacts",
            variant: "destructive",
          })
          return
        }

        try {
          // Insert contacts directly into Supabase
          const { error } = await supabase.from("contacts").insert(
            parsedContacts.map((contact) => ({
              user_id: user.id,
              name: contact.name,
              email: contact.email,
            })),
          )

          if (error) {
            throw error
          }

          toast({
            title: "Contacts imported",
            description: `Successfully imported ${parsedContacts.length} contacts`,
          })

          // Refresh contacts
          fetchContacts()
        } catch (error: any) {
          toast({
            title: "Error importing contacts",
            description: error.message,
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSaveTemplate = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      if (!templateName) {
        throw new Error("Template name is required")
      }

      if (!subject) {
        throw new Error("Subject is required")
      }

      if (!emailBody) {
        throw new Error("Email body is required")
      }

      const template = {
        user_id: user.id,
        name: templateName,
        subject,
        body: emailBody,
        attachments,
      }

      let response

      if (selectedTemplate?.id) {
        // Update existing template
        response = await apiService.updateTemplate(selectedTemplate.id, {
          name: templateName,
          subject,
          body: emailBody,
          attachments,
        })
      } else {
        // Create new template
        response = await apiService.createTemplate(template)
      }

      toast({
        title: "Template saved",
        description: "Your template has been saved successfully",
      })

      setShowSaveDialog(false)

      // If it's a new template, update the selected template
      if (!selectedTemplate?.id && response.template) {
        onTemplateChange(response.template)
      }
    } catch (error: any) {
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const clearContacts = async () => {
    if (!user) return

    try {
      const { error } = await supabase.from("contacts").delete().eq("user_id", user.id)

      if (error) {
        throw error
      }

      setContacts([])
      toast({
        title: "Contacts cleared",
        description: "All contacts have been removed",
      })
    } catch (error: any) {
      toast({
        title: "Error clearing contacts",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-upload">CSV File (Name, Email columns required)</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="mt-2"
              />
            </div>
            {isLoadingContacts ? (
              <div className="h-6 bg-muted animate-pulse rounded-md w-40"></div>
            ) : (
              contacts.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{contacts.length} contacts loaded</Badge>
                  <Button variant="outline" size="sm" onClick={clearContacts}>
                    Clear
                  </Button>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Composer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compose Email</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdvancedSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} disabled={!emailBody}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="mt-2"
            />
          </div>

          <div>
            <Label>Email Body</Label>
            <RichTextEditor
              value={emailBody}
              onChange={setEmailBody}
              placeholder="Compose your email... Use {name} and {email} for personalization"
            />
          </div>

          {/* File Attachments */}
          <FileUpload
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            maxFiles={5}
            maxSize={10}
          />

          <div className="flex gap-2">
            <Button onClick={() => setShowSaveDialog(true)} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button
              onClick={() => setShowSendModal(true)}
              disabled={!contacts.length || !subject || !emailBody}
              className="ml-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Bulk Email ({contacts.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variable Helper */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer" onClick={() => setEmailBody((prev) => prev + "{name}")}>
              {"{name}"}
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => setEmailBody((prev) => prev + "{email}")}
            >
              {"{email}"}
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => setEmailBody((prev) => prev + "{company}")}
            >
              {"{company}"}
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => setEmailBody((prev) => prev + "{jobTitle}")}
            >
              {"{jobTitle}"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AdvancedSettingsModal open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings} />

      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        subject={subject}
        body={emailBody}
        attachments={attachments}
        sampleContact={contacts[0]}
      />

      <SendEmailModal
        open={showSendModal}
        onOpenChange={setShowSendModal}
        contacts={contacts}
        subject={subject}
        body={emailBody}
        attachments={attachments}
      />

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>Give your template a name to save it for future use.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="My Email Template"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
