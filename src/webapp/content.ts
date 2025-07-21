// Content script to listen for postMessage from webapp and forward to background script
window.addEventListener('message', (event) => {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) {
    return;
  }

  if (event.data?.type === 'EXTENSION_TOKENS') {
    // Forward tokens to background script
    chrome.runtime.sendMessage({
      type: 'WEBAPP_TOKENS_RECEIVED',
      accessToken: event.data.accessToken,
      refreshToken: event.data.refreshToken
    }).catch((error) => {
      console.error('Failed to forward tokens to background script:', error);
    });
  }
});
