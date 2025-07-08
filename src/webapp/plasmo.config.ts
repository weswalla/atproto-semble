import { PlasmoConfig } from "plasmo"

const config: PlasmoConfig = {
  srcDir: "extension",
  assetsDir: "assets",
  outDir: "build-extension",
  manifest: {
    permissions: [
      "activeTab",
      "storage",
      "https://your-api-domain.com/*"
    ]
  }
}

export default config
