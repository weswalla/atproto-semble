import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Add save-to-library functionality to pages
console.log("Content script loaded")

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveCurrentPage") {
    const pageData = {
      url: window.location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
    }
    
    sendResponse({ success: true, data: pageData })
  }
})

// Add floating save button (optional)
function addSaveButton() {
  const button = document.createElement('button')
  button.innerHTML = '📚 Save'
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `
  
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'saveCurrentPage' })
  })
  
  document.body.appendChild(button)
}

// Uncomment to add floating save button
// addSaveButton()
