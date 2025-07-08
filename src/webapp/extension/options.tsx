import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import "../app/globals.css"

function OptionsPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Extension Settings</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            API Endpoint
          </label>
          <Input 
            type="url" 
            placeholder="https://your-api-domain.com"
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Auto-save pages
          </label>
          <input type="checkbox" className="mr-2" />
          <span className="text-sm">Automatically save pages to library</span>
        </div>
        
        <Button>Save Settings</Button>
      </div>
    </div>
  )
}

export default OptionsPage
