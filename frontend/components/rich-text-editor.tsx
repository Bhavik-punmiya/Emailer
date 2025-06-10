"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, Underline, Strikethrough, Link, List, ListOrdered } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newText)

    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const insertLink = () => {
    if (linkUrl && linkText) {
      const linkMarkdown = `[${linkText}](${linkUrl})`
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const newText = value.substring(0, start) + linkMarkdown + value.substring(start)
      onChange(newText)

      setLinkUrl("")
      setLinkText("")
      setShowLinkDialog(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault()
          insertText("**", "**")
          break
        case "i":
          e.preventDefault()
          insertText("*", "*")
          break
        case "u":
          e.preventDefault()
          insertText("<u>", "</u>")
          break
        case "k":
          e.preventDefault()
          setShowLinkDialog(true)
          break
      }
    }
  }

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
        <Button variant="ghost" size="sm" onClick={() => insertText("**", "**")} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={() => insertText("*", "*")} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={() => insertText("<u>", "</u>")} title="Underline (Ctrl+U)">
          <Underline className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={() => insertText("~~", "~~")} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Insert Link (Ctrl+K)">
              <Link className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-text">Link Text</Label>
                <Input
                  id="link-text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Enter link text"
                />
              </div>
              <div>
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <Button onClick={insertLink} className="w-full">
                Insert Link
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" onClick={() => insertText("• ")} title="Bullet List">
          <List className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={() => insertText("1. ")} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Text Area */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[300px] border-0 resize-none focus-visible:ring-0"
      />
    </div>
  )
}
