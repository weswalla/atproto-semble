import { Result } from 'src/shared/core/Result';
import { TokenPair } from '@semble/types';

export interface ITokenService {
  generateToken(did: string): Promise<Result<TokenPair>>;
  validateToken(token: string): Promise<Result<string | null>>; // Returns DID if valid
  refreshToken(refreshToken: string): Promise<Result<TokenPair | null>>;
  revokeToken(refreshToken: string): Promise<Result<void>>;
}
