import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  // Create a Supabase client that can read from cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })

  try {
    // Find the auth token cookie dynamically
    let authToken = null
    const cookieNames = request.cookies.getAll().map(cookie => cookie.name)
    for (const name of cookieNames) {
      if (name.includes('auth-token')) {
        authToken = request.cookies.get(name)?.value
        break
      }
    }
    
    if (authToken) {
      try {
        // Parse the token to check if it's valid
        const tokenData = JSON.parse(decodeURIComponent(authToken))
        const currentTime = Math.floor(Date.now() / 1000)
        
        // Check if token is expired
        if (tokenData.expires_at && tokenData.expires_at > currentTime) {
          // Token is valid and not expired
          if (requestUrl.pathname === "/login") {
            console.log("Middleware: Valid session found, redirecting from login to home")
            const redirectUrl = new URL("/", requestUrl.origin)
            return NextResponse.redirect(redirectUrl)
          }
        } else {
          // Token is expired, clear it
          console.log("Middleware: Token expired, clearing session")
          const response = NextResponse.next()
          // Clear all auth-related cookies
          for (const name of cookieNames) {
            if (name.includes('auth-token')) {
              response.cookies.delete(name)
            }
          }
          return response
        }
      } catch (parseError) {
        console.warn("Middleware: Error parsing auth token:", parseError)
        // Invalid token, clear it
        const response = NextResponse.next()
        // Clear all auth-related cookies
        for (const name of cookieNames) {
          if (name.includes('auth-token')) {
            response.cookies.delete(name)
          }
        }
        return response
      }
    } else {
      // No auth token found
      if (requestUrl.pathname !== "/login") {
        console.log("Middleware: No session found, redirecting to login")
        const redirectUrl = new URL("/login", requestUrl.origin)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // On error, allow the request to continue to prevent blocking
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
