"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileAttachment } from "@/lib/api"
import { Paperclip } from "lucide-react"

interface PreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: string
  body: string
  attachments?: FileAttachment[]
  sampleContact?: { name: string; email: string; company?: string; job_title?: string }
}

export function PreviewModal({ open, onOpenChange, subject, body, attachments = [], sampleContact }: PreviewModalProps) {
  const replaceVariables = (text: string) => {
    if (!sampleContact) return text
    return text
      .replace(/{name}/g, sampleContact.name)
      .replace(/{email}/g, sampleContact.email)
      .replace(/{company}/g, sampleContact.company || "{company}")
      .replace(/{jobTitle}/g, sampleContact.job_title || "{jobTitle}")
  }

  const formatEmailBody = (text: string) => {
    // If the text already contains HTML tags, use it as is
    if (text.includes('<') && text.includes('>')) {
      return text
    }
    
    // Convert markdown-style formatting to HTML
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // Code
      .replace(/^### (.*$)/gim, '<h3>$1</h3>') // H3
      .replace(/^## (.*$)/gim, '<h2>$1</h2>') // H2
      .replace(/^# (.*$)/gim, '<h1>$1</h1>') // H1
      .replace(/\n\n/g, '</p><p>') // Paragraphs
      .replace(/\n/g, '<br>') // Line breaks
    
    // Wrap in paragraph tags if not already wrapped
    if (!formatted.startsWith('<')) {
      formatted = `<p>${formatted}</p>`
    }
    
    return formatted
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <DialogDescription>
              Preview how your email will look to recipients
            </DialogDescription>
            {sampleContact && (
              <Badge variant="secondary">Sample: {sampleContact.name}</Badge>
            )}
          </div>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">To:</span>
                <span>{sampleContact?.email || "recipient@example.com"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Subject:</span>
                <span className="font-medium text-foreground">{replaceVariables(subject) || "No subject"}</span>
              </div>
              {attachments.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  <span className="font-medium">Attachments:</span>
                  <div className="flex gap-1">
                    {attachments.map((attachment, index) => (
                      <span key={index} className="text-xs">
                        {getFileIcon(attachment.filename)} {attachment.filename}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: formatEmailBody(replaceVariables(body)) || "No content",
              }}
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
