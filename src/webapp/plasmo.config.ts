import { PlasmoConfig } from "plasmo"

const config: PlasmoConfig = {
  srcDir: "./extension",
  outDir: "./build-extension",
  manifest: {
    permissions: [
      "activeTab",
      "storage",
      "https://your-api-domain.com/*"
    ],
    name: "Your App Extension",
    description: "Save pages to your library",
    version: "1.0.0",
    action: {
      default_title: "Your App Extension"
    }
  }
}

export default config
