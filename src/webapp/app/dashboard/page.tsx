"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getApiBaseUrl } from "@/lib/api"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken")
        
        if (!accessToken) {
          router.push("/login")
          return
        }
        
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }
        
        const userData = await response.json()
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [router])
  
  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    router.push("/")
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6">Welcome!</h2>
          
          {user && (
            <div className="mb-6">
              <p className="mb-2"><strong>Handle:</strong> {user.handle}</p>
              <p><strong>DID:</strong> {user.did}</p>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
