export interface ExtensionTokens {
  accessToken: string;
  refreshToken: string;
}

export class ExtensionService {
  private static readonly EXTENSION_MESSAGE_TYPE = 'EXTENSION_TOKENS';
  private static readonly EXTENSION_TOKENS_REQUESTED_KEY =
    'EXTENSION_TOKENS_REQUESTED';
  private static readonly EXTENSION_TOKENS_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  static async sendTokensToExtension(tokens: ExtensionTokens): Promise<void> {
    const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;

    try {
      // Try Chrome extension API first
      if (extensionId && window.chrome?.runtime) {
        await window.chrome.runtime.sendMessage(extensionId, {
          type: this.EXTENSION_MESSAGE_TYPE,
          ...tokens,
        });
        return;
      }

      // Fallback to postMessage - content script will forward to background
      window.postMessage(
        {
          type: this.EXTENSION_MESSAGE_TYPE,
          ...tokens,
        },
        window.location.origin,
      );
    } catch (error) {
      console.error('Failed to send tokens to extension:', error);
      throw new Error('Failed to communicate with extension');
    }
  }

  static isExtensionAvailable(): boolean {
    const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;
    return !!(extensionId && window.chrome?.runtime);
  }

  static setExtensionTokensRequested(): void {
    localStorage.setItem(
      this.EXTENSION_TOKENS_REQUESTED_KEY,
      Date.now().toString(),
    );
  }

  static isExtensionTokensRequested(): boolean {
    const timestamp = localStorage.getItem(this.EXTENSION_TOKENS_REQUESTED_KEY);
    if (!timestamp) return false;

    const requestTime = parseInt(timestamp, 10);
    const now = Date.now();

    // Check if request was made within the last 5 minutes
    return now - requestTime < this.EXTENSION_TOKENS_TIMEOUT;
  }

  static clearExtensionTokensRequested(): void {
    localStorage.removeItem(this.EXTENSION_TOKENS_REQUESTED_KEY);
  }
}
