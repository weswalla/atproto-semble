import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/api"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const handle = searchParams.get("handle")
  
  if (!handle) {
    return NextResponse.json(
      { message: "Handle is required" },
      { status: 400 }
    )
  }
  
  try {
    // Call the backend API to initiate OAuth
    const apiBaseUrl = getApiBaseUrl()
    const response = await fetch(`${apiBaseUrl}/api/users/login?handle=${handle}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to initiate login")
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("OAuth initiation error:", error)
    return NextResponse.json(
      { message: error.message || "An error occurred" },
      { status: 500 }
    )
  }
}
