"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User, AuthError } from "@supabase/supabase-js"
import { createBrowserSupabaseClient } from "@/lib/supabase"

// Enhanced error type with user-friendly messages
type EnhancedAuthError = {
  message: string
  code?: string
  status?: number
  name?: string
}

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: EnhancedAuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: EnhancedAuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to get user-friendly error messages
const getErrorMessage = (error: AuthError | null): string => {
  if (!error) return ""
  
  switch (error.message) {
    case "Invalid login credentials":
      return "Invalid email or password. Please check your credentials and try again."
    case "User already registered":
      return "An account with this email already exists. Please sign in instead."
    case "Password should be at least 6 characters":
      return "Password must be at least 6 characters long."
    case "Unable to validate email address: invalid format":
      return "Please enter a valid email address."
    case "Signup is disabled":
      return "Account creation is currently disabled. Please contact support."
    case "User not found":
      return "No account found with this email address. Please sign up first."
    case "Too many requests":
      return "Too many attempts. Please wait a moment before trying again."
    default:
      return error.message || "An authentication error occurred. Please try again."
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state listener...")
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthProvider: Auth state changed:", event, session ? "session exists" : "no session")
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Initial session check
    console.log("AuthProvider: Checking initial session...")
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Initial session:", session ? "exists" : "null")
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      console.log("AuthProvider: Cleaning up auth state listener...")
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log("AuthProvider: Starting sign in process...")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      console.error("AuthProvider: Sign in error:", error)
      // Enhance error message for better user experience
      const enhancedError: EnhancedAuthError = {
        message: getErrorMessage(error),
        code: error.code,
        status: error.status,
        name: error.name
      }
      return { error: enhancedError }
    }
    
    console.log("AuthProvider: Sign in successful, waiting for session...")
    // Wait for session to be established and refresh it
    await new Promise(resolve => setTimeout(resolve, 500))
    const { data: { session } } = await supabase.auth.getSession()
    console.log("AuthProvider: Session after sign in:", session ? "exists" : "null")
    
    return { error: null }
  }

  const signUp = async (email: string, password: string) => {
    console.log("AuthProvider: Starting sign up process...")
    // Sign up without email confirmation - user will be automatically confirmed
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          email_confirmed_at: new Date().toISOString()
        }
      }
    })
    
    if (error) {
      console.error("AuthProvider: Sign up error:", error)
      // Enhance error message for better user experience
      const enhancedError: EnhancedAuthError = {
        message: getErrorMessage(error),
        code: error.code,
        status: error.status,
        name: error.name
      }
      return { error: enhancedError }
    }
    
    console.log("AuthProvider: Sign up successful, attempting auto sign in...")
    // If signup is successful, automatically sign in the user
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    
    if (signInError) {
      console.error("AuthProvider: Auto sign in error:", signInError)
      const enhancedError: EnhancedAuthError = {
        message: "Account created successfully but automatic sign-in failed. Please sign in manually.",
        code: signInError.code,
        status: signInError.status,
        name: signInError.name
      }
      return { error: enhancedError }
    }
    
    console.log("AuthProvider: Auto sign in successful, waiting for session...")
    // Wait for session to be established and refresh it
    await new Promise(resolve => setTimeout(resolve, 1000))
    const { data: { session } } = await supabase.auth.getSession()
    console.log("AuthProvider: Session after sign up:", session ? "exists" : "null")
    
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
