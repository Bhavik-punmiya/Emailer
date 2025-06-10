"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TemplatesSidebar } from "@/components/templates-sidebar"
import { EmailComposer } from "@/components/email-composer"
import { SidebarInset } from "@/components/ui/sidebar"
import { Header } from "@/components/header"

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Home page: User not authenticated, redirecting to login")
      router.replace("/login")
    }
  }, [user, isLoading, router])

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
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 p-6 overflow-auto">
              <EmailComposer selectedTemplate={selectedTemplate} onTemplateChange={setSelectedTemplate} />
            </main>
            <TemplatesSidebar onTemplateSelect={setSelectedTemplate} selectedTemplate={selectedTemplate} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
