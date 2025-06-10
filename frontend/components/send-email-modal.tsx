"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, CheckCircle, XCircle, Clock, Users, Mail } from "lucide-react"
import { apiService, Contact, EmailTemplate, CampaignStatus, FileAttachment } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"

interface SendEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Contact[]
  subject: string
  body: string
  attachments?: FileAttachment[]
}

export function SendEmailModal({ open, onOpenChange, contacts, subject, body, attachments = [] }: SendEmailModalProps) {
  const [isSending, setIsSending] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus | null>(null)
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (campaignId && isSending) {
      // Poll for status updates
      const interval = setInterval(async () => {
        try {
          const status = await apiService.getCampaignStatus(campaignId)
          setCampaignStatus(status)
          
          if (status.status === 'completed' || status.status === 'failed') {
            setIsSending(false)
            clearInterval(interval)
            setStatusInterval(null)
          }
        } catch (error) {
          console.error('Error fetching campaign status:', error)
        }
      }, 2000) // Poll every 2 seconds
      
      setStatusInterval(interval)
    }

    return () => {
      if (statusInterval) {
        clearInterval(statusInterval)
      }
    }
  }, [campaignId, isSending])

  const handleSend = async () => {
    if (!user) return

    setIsSending(true)
    setCampaignStatus(null)

    try {
      const template: EmailTemplate = {
        name: `Campaign ${new Date().toISOString()}`,
        subject,
        body,
      }

      const result = await apiService.sendEmails({
        contacts,
        template,
        user_id: user.id,
        attachments,
      })

      setCampaignId(result.campaign_id)
      toast({
        title: "Campaign started",
        description: result.message,
      })
    } catch (error: any) {
      toast({
        title: "Error sending emails",
        description: error.message,
        variant: "destructive",
      })
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (statusInterval) {
      clearInterval(statusInterval)
      setStatusInterval(null)
    }
    setCampaignId(null)
    setCampaignStatus(null)
    setIsSending(false)
    onOpenChange(false)
  }

  const progress = campaignStatus?.progress || 0
  const results = campaignStatus ? {
    sent: campaignStatus.sent,
    failed: campaignStatus.failed,
    total: campaignStatus.total
  } : null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 flex-shrink-0" />
            Send Bulk Email
          </DialogTitle>
          <DialogDescription>Review your email details before sending to all contacts.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">
                    <strong>{contacts.length}</strong> recipients
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm">
                      <strong>Subject:</strong>
                    </span>
                    <p className="text-sm text-muted-foreground break-words mt-1">
                      {subject}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {isSending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Sending emails...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {results && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sending Complete</span>
                    <Badge variant="secondary">
                      {results.sent}/{results.total} sent
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">
                        <strong>{results.sent}</strong> successful
                      </span>
                    </div>
                    {results.failed > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span className="text-sm">
                          <strong>{results.failed}</strong> failed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              {results ? "Close" : "Cancel"}
            </Button>
            {!results && (
              <Button onClick={handleSend} disabled={isSending} className="min-w-[120px]">
                {isSending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2 flex-shrink-0" />
                    Send Now
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
