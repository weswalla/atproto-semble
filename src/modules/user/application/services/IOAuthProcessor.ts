import { Result } from 'src/shared/core/Result';
import { OAuthCallbackDTO } from '@semble/types';

export interface AuthResult {
  did: string;
  handle?: string;
}

export interface IOAuthProcessor {
  generateAuthUrl(handle?: string): Promise<Result<string>>;
  processCallback(params: OAuthCallbackDTO): Promise<Result<AuthResult>>;
}
