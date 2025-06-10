"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { apiService, SavedTemplate, FileAttachment } from "@/lib/api"
import { FileUpload } from "@/components/file-upload"
import { TemplateDetailModal } from "@/components/template-detail-modal"
import { FileText, Plus, Edit, Trash2, Copy, Eye, ExternalLink } from "lucide-react"
import { toast } from "sonner"

export default function Templates() {
  const [templates, setTemplates] = useState<SavedTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SavedTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: ""
  })
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Templates: User not authenticated, redirecting to login")
      router.replace("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await apiService.getTemplates()
      setTemplates(response.templates)
    } catch (error) {
      console.error("Error loading templates:", error)
      toast.error("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      if (!formData.name || !formData.subject || !formData.body) {
        toast.error("Please fill in all fields")
        return
      }

      await apiService.createTemplate({
        user_id: user!.id,
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        attachments
      })

      toast.success("Template created successfully")
      setIsCreateDialogOpen(false)
      setFormData({ name: "", subject: "", body: "" })
      setAttachments([])
      loadTemplates()
    } catch (error) {
      console.error("Error creating template:", error)
      toast.error("Failed to create template")
    }
  }

  const handleEditTemplate = async () => {
    try {
      if (!selectedTemplate?.id || !formData.name || !formData.subject || !formData.body) {
        toast.error("Please fill in all fields")
        return
      }

      await apiService.updateTemplate(selectedTemplate.id, {
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        attachments
      })

      toast.success("Template updated successfully")
      setIsEditDialogOpen(false)
      setSelectedTemplate(null)
      setFormData({ name: "", subject: "", body: "" })
      setAttachments([])
      loadTemplates()
    } catch (error) {
      console.error("Error updating template:", error)
      toast.error("Failed to update template")
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await apiService.deleteTemplate(templateId)
      toast.success("Template deleted successfully")
      loadTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Failed to delete template")
    }
  }

  const handleEditClick = (template: SavedTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body
    })
    setAttachments(template.attachments || [])
    setIsEditDialogOpen(true)
  }

  const handlePreviewClick = (template: SavedTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewDialogOpen(true)
  }

  const handleDetailClick = (template: SavedTemplate) => {
    setSelectedTemplate(template)
    setIsDetailModalOpen(true)
  }

  const handleTemplateUpdate = (updatedTemplate: SavedTemplate) => {
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t))
    setSelectedTemplate(updatedTemplate)
  }

  const handleTemplateDelete = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId))
    setSelectedTemplate(null)
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Saved Templates</h1>
                  <p className="text-muted-foreground">
                    Manage your email templates
                  </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Template</DialogTitle>
                      <DialogDescription>
                        Create a new email template that you can reuse for your campaigns.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter template name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject Line</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Enter email subject"
                        />
                      </div>
                      <div>
                        <Label htmlFor="body">Email Body</Label>
                        <Textarea
                          id="body"
                          value={formData.body}
                          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                          placeholder="Enter email content. Use {name}, {email}, {company}, {jobTitle} for personalization."
                          rows={10}
                        />
                      </div>
                      <FileUpload
                        attachments={attachments}
                        onAttachmentsChange={setAttachments}
                        maxFiles={5}
                        maxSize={10}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTemplate}>
                        Create Template
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Templates Grid */}
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No templates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first email template to get started
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleDetailClick(template)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {template.subject}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {formatDate(template.created_at || "")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {template.body.substring(0, 150)}...
                          </p>
                          
                          {/* Attachments indicator */}
                          {template.attachments && template.attachments.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>📎</span>
                              <span>{template.attachments.length} attachment(s)</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePreviewClick(template)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditClick(template)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDetailClick(template)
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => template.id && handleDeleteTemplate(template.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Edit Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Template</DialogTitle>
                    <DialogDescription>
                      Update your email template.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Template Name</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-subject">Subject Line</Label>
                      <Input
                        id="edit-subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Enter email subject"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-body">Email Body</Label>
                      <Textarea
                        id="edit-body"
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        placeholder="Enter email content. Use {name}, {email}, {company}, {jobTitle} for personalization."
                        rows={10}
                      />
                    </div>
                    <FileUpload
                      attachments={attachments}
                      onAttachmentsChange={setAttachments}
                      maxFiles={5}
                      maxSize={10}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEditTemplate}>
                      Update Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Preview Dialog */}
              <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Template Preview</DialogTitle>
                    <DialogDescription>
                      Preview of "{selectedTemplate?.name}"
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Subject</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {selectedTemplate?.subject}
                      </div>
                    </div>
                    <div>
                      <Label>Body</Label>
                      <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">
                        {selectedTemplate?.body}
                      </div>
                    </div>
                    {selectedTemplate?.attachments && selectedTemplate.attachments.length > 0 && (
                      <div>
                        <Label>Attachments</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {selectedTemplate.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                              <span>{getFileIcon(attachment.filename)}</span>
                              <span>{attachment.filename}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => selectedTemplate?.subject && handleCopyToClipboard(selectedTemplate.subject)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Subject
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => selectedTemplate?.body && handleCopyToClipboard(selectedTemplate.body)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Body
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Template Detail Modal */}
              <TemplateDetailModal
                open={isDetailModalOpen}
                onOpenChange={setIsDetailModalOpen}
                template={selectedTemplate}
                onTemplateUpdate={handleTemplateUpdate}
                onTemplateDelete={handleTemplateDelete}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 