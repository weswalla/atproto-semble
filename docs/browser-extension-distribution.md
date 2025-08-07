# Browser Extension Distribution Guide

This guide covers how to build and distribute the browser extension for team testing and production use.

## Building the Extension

### Development Build

```bash
npm run dev:extension
# or
plasmo dev
```

### Production Build

```bash
npm run build:extension
# or
plasmo build
```

This creates a `build/` directory with the production-ready extension files.

### Package for Distribution

```bash
npm run package:extension
# or
plasmo package
```

This creates a `.zip` file in the `build/` directory that's ready for distribution.

## Distribution Options

### Option A: Share the Build Folder

1. Zip the entire `build/chrome-mv3-prod/` folder
2. Share the zip file with your team
3. Team members can load it as an unpacked extension

### Option B: Use the Packaged ZIP

1. Share the `.zip` file created by `plasmo package`
2. Team members can extract and load it

## Installation Instructions for Team Members

Send these instructions to your team:

1. **Open Chrome Extensions page**: Go to `chrome://extensions/`
2. **Enable Developer mode**: Toggle the switch in the top-right corner
3. **Load the extension**:
   - Click "Load unpacked"
   - Select the extracted extension folder (the one containing `manifest.json`)
4. **Pin the extension**: Click the puzzle piece icon and pin your extension for easy access

## Chrome Web Store Distribution (Private)

For more professional distribution:

1. **Create a Chrome Web Store developer account** ($5 one-time fee)
2. **Upload your packaged extension**
3. **Set visibility to "Private"** or "Unlisted"
4. **Share the private link** with your team members

## Automated Distribution with GitHub Actions

You can set up GitHub Actions to automatically build and create releases:

```yaml
# .github/workflows/build-extension.yml
name: Build Extension
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build:extension
      - run: npm run package:extension
      - uses: actions/upload-artifact@v3
        with:
          name: extension-build
          path: build/*.zip
```

## Quick Start for Team Testing

The fastest approach for immediate team testing:

1. Run `npm run build:extension`
2. Zip the `build/chrome-mv3-prod/` folder
3. Share the zip file with your team
4. Provide the installation instructions above

Your team can then install and test the extension immediately!

## Troubleshooting

### Common Issues

- **Extension not loading**: Make sure you're selecting the folder that contains `manifest.json`
- **Permissions errors**: Ensure the extension has the necessary permissions in the manifest
- **Updates not showing**: Reload the extension in `chrome://extensions/` after making changes

### Development vs Production

- Development builds include source maps and debugging tools
- Production builds are optimized and minified
- Always test with production builds before distributing
