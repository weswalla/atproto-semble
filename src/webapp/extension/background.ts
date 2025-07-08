import { ApiClient } from "../api-client/ApiClient"

// Handle extension-specific functionality
chrome.action.onClicked.addListener(async (tab) => {
  // Save current page to library
  if (tab.url && tab.title) {
    try {
      // Get auth token from storage
      const result = await chrome.storage.local.get(['accessToken'])
      const token = result.accessToken
      
      if (!token) {
        // Open popup for authentication
        chrome.action.openPopup()
        return
      }
      
      // Initialize API client with token
      const apiClient = new ApiClient('https://your-api-domain.com', () => token)
      
      // Save the page (you'll need to implement this method in your API client)
      // await apiClient.cards.createUrlCard({
      //   url: tab.url,
      //   title: tab.title
      // })
      
      console.log('Page saved successfully')
    } catch (error) {
      console.error('Failed to save page:', error)
    }
  }
})

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveCurrentPage') {
    // Handle saving page data
    console.log('Saving page:', request.data)
    sendResponse({ success: true })
  }
})

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed')
})
