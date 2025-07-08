# Browser Extension Setup with Plasmo

This guide walks through setting up a browser extension using Plasmo framework while reusing existing webapp components and code.

## Overview

We'll use Plasmo (Option 3) which provides:
- Built specifically for modern web extensions
- Excellent TypeScript support
- Hot reloading during development
- Handles Manifest V3 complexities
- Easy component sharing

## Setup Steps

### 1. Install Plasmo

```bash
cd src/webapp
pnpm add -D plasmo
```

### 2. File Structure

Plasmo uses convention over configuration. Extension files go directly in the webapp root:

```
src/
  webapp/
    app/              # Keep existing Next.js app
    components/       # Keep existing components
    hooks/            # Keep existing hooks
    api-client/       # Keep existing API client
    popup.tsx         # Extension popup (root level)
    options.tsx       # Extension options page (root level)
    content.ts        # Content scripts (root level)
    background.ts     # Background script (root level)
    package.json      # Update this
```

### 3. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:extension": "plasmo dev",
    "build": "next build",
    "build:extension": "plasmo build",
    "package:extension": "plasmo package"
  }
}
```

### 4. File Structure

Plasmo uses convention over configuration. Extension files go directly in the webapp root:

```
src/
  webapp/
    app/              # Keep existing Next.js app
    components/       # Keep existing components
    hooks/            # Keep existing hooks
    api-client/       # Keep existing API client
    popup.tsx         # Extension popup (root level)
    options.tsx       # Extension options page (root level)
    content.ts        # Content scripts (root level)
    background.ts     # Background script (root level)
    package.json      # Update this
```

### 5. Create Extension Entry Points

**popup.tsx:**
```typescript
import { useAuth } from "./hooks/useAuth"
import { Button } from "./components/ui/button"
import "./app/globals.css" // Reuse your styles

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
```

**content.ts:**
```typescript
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Add save-to-library functionality to pages
console.log("Content script loaded")
```

### 6. Update Your Auth Hook for Extension

**hooks/useAuth.tsx:**
```typescript
// Add extension-specific storage
const isExtension = typeof chrome !== 'undefined' && chrome.storage

const useAuth = () => {
  // Use chrome.storage for extension, localStorage for webapp
  const storage = isExtension ? chrome.storage.local : localStorage
  
  // Rest of your existing auth logic...
}
```

### 7. Shared Component Configuration

Create **shared/components/** and move reusable components:

```typescript
// Move these to shared/components/
- UrlCard.tsx
- Sidebar.tsx  
- ui/ components
```

Update imports in both webapp and extension to use shared components.

### 8. Development Workflow

**Terminal 1 - Webapp:**
```bash
cd src/webapp
pnpm dev
```

**Terminal 2 - Extension:**
```bash
cd src/webapp
pnpm dev:extension
```

### 9. Load Extension in Browser

1. Run `pnpm dev:extension`
2. Open Chrome → Extensions → Developer mode
3. Click "Load unpacked" → Select `src/webapp/build-extension`
4. Extension auto-reloads on code changes!

### 10. Handle Extension-Specific APIs

**background.ts:**
```typescript
import { ApiClient } from "./api-client/ApiClient"

// Handle extension-specific functionality
chrome.action.onClicked.addListener((tab) => {
  // Save current page to library
})
```

## Key Benefits of This Setup

- ✅ **Live Reloading:** Plasmo provides hot reload for extension development
- ✅ **Code Reuse:** Share components, hooks, and API client
- ✅ **TypeScript:** Full TypeScript support
- ✅ **Separate Builds:** Webapp and extension build independently
- ✅ **Modern Tooling:** Uses your existing build tools

## Development Commands

```bash
# Develop webapp
pnpm dev

# Develop extension (with live reload)
pnpm dev:extension

# Build extension for production
pnpm build:extension

# Package extension as .zip
pnpm package:extension
```

## Notes

- The extension will automatically reload in the browser when you make changes to any extension files
- Use chrome.storage for extension-specific data persistence
- Share as much code as possible between webapp and extension
- Test in both Chrome and Firefox during development
