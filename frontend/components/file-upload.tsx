"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Upload, File, Paperclip } from "lucide-react"
import { FileAttachment } from "@/lib/api"

interface FileUploadProps {
  attachments: FileAttachment[]
  onAttachmentsChange: (attachments: FileAttachment[]) => void
  maxFiles?: number
  maxSize?: number // in MB
}

export function FileUpload({ 
  attachments, 
  onAttachmentsChange, 
  maxFiles = 5, 
  maxSize = 10 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const convertFileToAttachment = useCallback(async (file: File): Promise<FileAttachment | null> => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`)
      return null
    }

    // Check file count
    if (attachments.length >= maxFiles) {
      alert(`Maximum ${maxFiles} files allowed.`)
      return null
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      return {
        filename: file.name,
        content: base64,
        content_type: file.type || 'application/octet-stream'
      }
    } catch (error) {
      console.error('Error converting file:', error)
      alert(`Error processing file ${file.name}`)
      return null
    }
  }, [attachments.length, maxFiles, maxSize])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return

    const newAttachments: FileAttachment[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const attachment = await convertFileToAttachment(file)
      if (attachment) {
        newAttachments.push(attachment)
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments])
    }
  }, [attachments, convertFileToAttachment, onAttachmentsChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    onAttachmentsChange(newAttachments)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        <span className="text-sm font-medium">Attachments</span>
        <Badge variant="secondary" className="text-xs">
          {attachments.length}/{maxFiles} files
        </Badge>
      </div>

      {/* File Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragOver 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}>
        <CardContent className="p-6">
          <div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum {maxFiles} files, {maxSize}MB each
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.onchange = (e) => handleFileSelect((e.target as HTMLInputElement).files)
                input.click()
              }}
            >
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Files:</h4>
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getFileIcon(attachment.filename)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{attachment.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.content_type} • {formatFileSize(attachment.content.length * 0.75)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 