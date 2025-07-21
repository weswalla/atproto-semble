// Background script for handling extension messaging and auth state
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTENSION_TOKENS') {
    handleExtensionTokens(message, sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'WEBAPP_TOKENS_RECEIVED') {
    handleWebappTokens(message, sendResponse);
    return true;
  }
});

// Handle tokens received directly via chrome.runtime.sendMessage
async function handleExtensionTokens(message: any, sendResponse: (response: any) => void) {
  try {
    const { accessToken, refreshToken } = message;
    
    if (!accessToken) {
      sendResponse({ success: false, error: 'No access token provided' });
      return;
    }

    // Store tokens in chrome.storage
    await chrome.storage.local.set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
      authTimestamp: Date.now()
    });

    // Notify all extension pages about the auth change
    chrome.runtime.sendMessage({
      type: 'AUTH_STATE_CHANGED',
      isAuthenticated: true
    }).catch(() => {
      // Ignore errors if no listeners
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to handle extension tokens:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

// Handle tokens forwarded from content script (postMessage)
async function handleWebappTokens(message: any, sendResponse: (response: any) => void) {
  try {
    const { accessToken, refreshToken } = message;
    
    if (!accessToken) {
      sendResponse({ success: false, error: 'No access token provided' });
      return;
    }

    // Store tokens in chrome.storage
    await chrome.storage.local.set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
      authTimestamp: Date.now()
    });

    // Notify all extension pages about the auth change
    chrome.runtime.sendMessage({
      type: 'AUTH_STATE_CHANGED',
      isAuthenticated: true
    }).catch(() => {
      // Ignore errors if no listeners
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to handle webapp tokens:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

// Handle auth logout
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOGOUT') {
    handleLogout(sendResponse);
    return true;
  }
});

async function handleLogout(sendResponse: (response: any) => void) {
  try {
    // Clear all auth data
    await chrome.storage.local.remove([
      'accessToken',
      'refreshToken',
      'isAuthenticated',
      'authTimestamp'
    ]);

    // Notify all extension pages about the auth change
    chrome.runtime.sendMessage({
      type: 'AUTH_STATE_CHANGED',
      isAuthenticated: false
    }).catch(() => {
      // Ignore errors if no listeners
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to handle logout:', error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}
