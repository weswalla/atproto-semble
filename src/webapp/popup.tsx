import { useState } from "react"
import "./app/globals.css" // Reuse your styles

function IndexPopup() {
  const [currentUrl, setCurrentUrl] = useState("")
  
  // Get current tab URL when popup opens
  useState(() => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setCurrentUrl(tabs[0].url)
        }
      })
    }
  })
  
  return (
    <div className="w-80 p-4 bg-white">
      <div className="border-b pb-3 mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Card Extension</h1>
        <p className="text-sm text-gray-600">Save and organize web content</p>
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
        
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 text-center">
            Extension is working! 🎉
          </p>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
