import { OAuthClientMetadataInput } from "@atproto/oauth-client-node";

export class OAuthClientFactory {
  static getClientMetadata(
    baseUrl: string,
    appName: string = "Annotation App"
  ): { clientMetadata: OAuthClientMetadataInput } {
    const publicUrl = process.env.PUBLIC_URL;
    const url = baseUrl || "http://localhost:3000";
    const enc = encodeURIComponent;

    return {
      clientMetadata: {
        client_name: appName,
        client_id: publicUrl
          ? `${url}/client-metadata.json`
          : `http://localhost?redirect_uri=${enc(`${url}/oauth/callback`)}&scope=${enc("atproto transition:generic")}`,
        client_uri: url,
        redirect_uris: [`${url}/oauth/callback`],
        scope: "atproto transition:generic",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "web",
        token_endpoint_auth_method: "none",
        dpop_bound_access_tokens: true,
      },
    };
  }
}
