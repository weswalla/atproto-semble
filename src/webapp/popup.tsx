import { useState } from "react"
import { useAuth, AuthProvider } from "./hooks/useAuth"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import "./app/globals.css" // Reuse your styles

function PopupContent() {
  const { isAuthenticated, login } = useAuth()
  const [handle, setHandle] = useState("")
  
  return (
    <div className="w-80 p-4">
      <h1 className="text-lg font-semibold mb-4">Your App Extension</h1>
      {isAuthenticated ? (
        <div>Welcome back!</div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Handle
            </label>
            <Input 
              type="text" 
              placeholder="user.bsky.social"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full"
            />
          </div>
          <Button 
            onClick={() => login(handle)} 
            className="w-full"
            disabled={!handle.trim()}
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  )
}

function IndexPopup() {
  return (
    <AuthProvider>
      <PopupContent />
    </AuthProvider>
  )
}

export default IndexPopup
