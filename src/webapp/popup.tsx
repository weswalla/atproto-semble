import { useState, useEffect } from "react"
import { ExtensionAuthProvider, useExtensionAuth } from "./hooks/useExtensionAuth"
import "./app/globals.css" // Reuse your styles

function PopupContent() {
  const { isAuthenticated, isLoading, user, loginWithAppPassword, logout, error } = useExtensionAuth();
  const [currentUrl, setCurrentUrl] = useState("")
  const [handle, setHandle] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get current tab URL when popup opens
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setCurrentUrl(tabs[0].url)
        }
      })
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!handle.trim() || !password.trim()) return

    try {
      setIsSubmitting(true)
      await loginWithAppPassword(handle.trim(), password.trim())
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-80 p-4 bg-white">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="w-80 p-4 bg-white">
        <div className="border-b pb-3 mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Card Extension</h1>
          <p className="text-sm text-gray-600">Sign in to save content</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Handle
            </label>
            <input
              type="text"
              placeholder="user.bsky.social"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              App Password
            </label>
            <input
              type="password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>
          
          <button
            type="submit"
            disabled={!handle.trim() || !password.trim() || isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    )
  }
  
  return (
    <div className="w-80 p-4 bg-white">
      <div className="border-b pb-3 mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Card Extension</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Welcome back!</p>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Current page:</p>
          <p className="text-sm text-gray-800 truncate" title={currentUrl}>
            {currentUrl || "Loading..."}
          </p>
        </div>
        
        <div className="space-y-2">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
            Save as Card
          </button>
          
          <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
            View Library
          </button>
        </div>
      </div>
    </div>
  )
}

function IndexPopup() {
  return (
    <ExtensionAuthProvider>
      <PopupContent />
    </ExtensionAuthProvider>
  )
}

export default IndexPopup
