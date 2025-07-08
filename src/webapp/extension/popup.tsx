import { useAuth } from "../hooks/useAuth"
import { Button } from "../components/ui/button"
import "../app/globals.css" // Reuse your styles

function IndexPopup() {
  const { isAuthenticated, login } = useAuth()
  
  return (
    <div className="w-80 p-4">
      <h1>Your App Extension</h1>
      {isAuthenticated ? (
        <div>Welcome back!</div>
      ) : (
        <Button onClick={() => login()}>Sign In</Button>
      )}
    </div>
  )
}

export default IndexPopup
