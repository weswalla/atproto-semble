"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authService } from "@/services/api"

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Processing your login...")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the code, state, and iss from the URL
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const iss = searchParams.get("iss") || ""
        
        if (!code || !state) {
          throw new Error("Missing required parameters")
        }
        
        // Use the authService to complete the OAuth flow
        const { accessToken, refreshToken } = await authService.completeOAuth(code, state, iss)
        
        // Store tokens in localStorage
        localStorage.setItem("accessToken", accessToken)
        localStorage.setItem("refreshToken", refreshToken)
        
        setStatus("success")
        setMessage("Login successful!")
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } catch (err: any) {
        setStatus("error")
        setMessage(err.message || "An error occurred during authentication")
      }
    }
    
    processCallback()
  }, [searchParams, router])
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          {status === "loading" && (
            <>
              <h2 className="text-2xl font-semibold mb-4">Completing Sign In</h2>
              <p className="mb-4">Please wait while we complete your authentication...</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            </>
          )}
          
          {status === "success" && (
            <>
              <h2 className="text-2xl font-semibold mb-4 text-green-600">Success!</h2>
              <p>{message}</p>
              <p className="mt-2">Redirecting you to your dashboard...</p>
            </>
          )}
          
          {status === "error" && (
            <>
              <h2 className="text-2xl font-semibold mb-4 text-red-600">Error</h2>
              <p>{message}</p>
              <button 
                onClick={() => router.push("/login")}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
