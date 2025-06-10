"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { apiService, SavedTemplate, FileAttachment } from "@/lib/api"
import { Edit, Save, X, Copy, Eye, Download, Trash2, Paperclip } from "lucide-react"
import { toast } from "sonner"

interface TemplateDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: SavedTemplate | null
  onTemplateUpdate: (template: SavedTemplate) => void
  onTemplateDelete: (templateId: string) => void
}

export function TemplateDetailModal({ 
  open, 
  onOpenChange, 
  template, 
  onTemplateUpdate, 
  onTemplateDelete 
}: TemplateDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: ""
  })
  const [attachments, setAttachments] = useState<FileAttachment[]>([])

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body
      })
      setAttachments(template.attachments || [])
      setIsEditing(false)
    }
  }, [template])

  const handleSave = async () => {
    if (!template?.id) return

    setIsSaving(true)
    try {
      const updatedTemplate = await apiService.updateTemplate(template.id, {
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        attachments
      })

      onTemplateUpdate(updatedTemplate.template)
      setIsEditing(false)
      toast.success("Template updated successfully")
    } catch (error) {
      console.error("Error updating template:", error)
      toast.error("Failed to update template")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!template?.id) return

    try {
      await apiService.deleteTemplate(template.id)
      onTemplateDelete(template.id)
      onOpenChange(false)
      toast.success("Template deleted successfully")
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Failed to delete template")
    }
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const handleDownloadAttachment = (attachment: FileAttachment) => {
    try {
      const binaryString = atob(attachment.content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const blob = new Blob([bytes], { type: attachment.content_type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading attachment:", error)
      toast.error("Failed to download attachment")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'ppt':
      case 'pptx':
        return '📈'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      case 'zip':
      case 'rar':
        return '📦'
      default:
        return '📎'
    }
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {isEditing ? "Edit Template" : template.name}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? "Update your email template" 
                  : `Created ${formatDate(template.created_at || "")}`
                }
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyToClipboard(template.body)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Body
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Name */}
          {isEditing ? (
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter template name"
                className="mt-2"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{template.name}</h3>
              <Badge variant="secondary">Template</Badge>
            </div>
          )}

          {/* Subject Line */}
          {isEditing ? (
            <div>
              <Label htmlFor="template-subject">Subject Line</Label>
              <Input
                id="template-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter email subject"
                className="mt-2"
              />
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Subject Line</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{template.subject}</p>
              </CardContent>
            </Card>
          )}

          {/* Email Body */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Email Body</CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyToClipboard(template.body)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div>
                  <Label htmlFor="template-body">Content</Label>
                  <Textarea
                    id="template-body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Enter email content. Use {name}, {email}, {company}, {jobTitle} for personalization."
                    rows={15}
                    className="mt-2 font-mono text-sm"
                  />
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: template.body.includes('<') && template.body.includes('>')
                        ? template.body
                        : template.body
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/`(.*?)`/g, '<code>$1</code>')
                            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                            .replace(/\n\n/g, '</p><p>')
                            .replace(/\n/g, '<br>')
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <CardTitle className="text-base">Attachments</CardTitle>
                <Badge variant="secondary">{attachments.length} files</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <FileUpload
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  maxFiles={5}
                  maxSize={10}
                />
              ) : attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getFileIcon(attachment.filename)}</span>
                        <div>
                          <p className="font-medium">{attachment.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {attachment.content_type} • {(attachment.content.length * 0.75 / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadAttachment(attachment)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No attachments</p>
              )}
            </CardContent>
          </Card>

          {/* Delete Button */}
          {!isEditing && (
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Template
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 