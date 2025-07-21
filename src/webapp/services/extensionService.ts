export interface ExtensionTokens {
  accessToken: string;
  refreshToken: string;
}

export class ExtensionService {
  private static readonly EXTENSION_MESSAGE_TYPE = 'EXTENSION_TOKENS';

  static async sendTokensToExtension(tokens: ExtensionTokens): Promise<void> {
    const extensionId = process.env.PLASMO_PUBLIC_EXTENSION_ID;
    
    try {
      // Try Chrome extension API first
      if (extensionId && window.chrome?.runtime) {
        await window.chrome.runtime.sendMessage(extensionId, {
          type: this.EXTENSION_MESSAGE_TYPE,
          ...tokens,
        });
        return;
      }

      // Fallback to postMessage for development or other scenarios
      window.postMessage({
        type: this.EXTENSION_MESSAGE_TYPE,
        ...tokens,
      }, '*');
    } catch (error) {
      console.error('Failed to send tokens to extension:', error);
      throw new Error('Failed to communicate with extension');
    }
  }

  static isExtensionAvailable(): boolean {
    const extensionId = process.env.PLASMO_PUBLIC_EXTENSION_ID;
    return !!(extensionId && window.chrome?.runtime);
  }
}
