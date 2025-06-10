"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiService } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"

export function AuthTest() {
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { user, session } = useAuth()

  const testAuth = async () => {
    setIsLoading(true)
    setTestResult("")
    
    try {
      const result = await apiService.testAuth()
      setTestResult(`✅ Success: ${result.message} (User ID: ${result.user_id})`)
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-2">
          <div>User ID: {user?.id || "Not logged in"}</div>
          <div>Session: {session ? "Active" : "No session"}</div>
          <div>Access Token: {session?.access_token ? `${session.access_token.substring(0, 20)}...` : "None"}</div>
        </div>
        
        <Button onClick={testAuth} disabled={isLoading}>
          {isLoading ? "Testing..." : "Test Authentication"}
        </Button>
        
        {testResult && (
          <div className="text-sm p-2 bg-muted rounded">
            {testResult}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 