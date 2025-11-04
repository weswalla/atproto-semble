import { UseCase } from 'src/shared/core/UseCase';
import { Result, err, ok } from 'src/shared/core/Result';
import { AppError } from 'src/shared/core/AppError';
import { ITokenService } from '../services/ITokenService';
import { TokenPair } from '@semble/types';
import { RefreshAccessTokenErrors } from './errors/RefreshAccessTokenErrors';

const ENABLE_REFRESH_LOGGING = true;

export interface RefreshAccessTokenDTO {
  refreshToken: string;
}

export type RefreshAccessTokenResponse = Result<
  TokenPair,
  RefreshAccessTokenErrors.InvalidRefreshTokenError | AppError.UnexpectedError
>;

export class RefreshAccessTokenUseCase
  implements UseCase<RefreshAccessTokenDTO, Promise<RefreshAccessTokenResponse>>
{
  constructor(private tokenService: ITokenService) {}

  async execute(
    request: RefreshAccessTokenDTO,
  ): Promise<RefreshAccessTokenResponse> {
    try {
      if (ENABLE_REFRESH_LOGGING) {
        const tokenPreview = '...' + request.refreshToken.slice(-8);
        console.log(
          `[RefreshAccessTokenUseCase] Attempting token refresh with token: ${tokenPreview}`,
        );
      }

      const tokenResult = await this.tokenService.refreshToken(
        request.refreshToken,
      );

      if (tokenResult.isErr()) {
        if (ENABLE_REFRESH_LOGGING) {
          console.log(
            `[RefreshAccessTokenUseCase] Token refresh failed: ${tokenResult.error.message}`,
          );
        }
        return err(new AppError.UnexpectedError(tokenResult.error));
      }

      if (!tokenResult.value) {
        if (ENABLE_REFRESH_LOGGING) {
          console.log(
            `[RefreshAccessTokenUseCase] Token refresh returned null - invalid refresh token`,
          );
        }
        return err(new RefreshAccessTokenErrors.InvalidRefreshTokenError());
      }

      if (ENABLE_REFRESH_LOGGING) {
        console.log(`[RefreshAccessTokenUseCase] Token refresh successful`);
      }

      return ok(tokenResult.value);
    } catch (error: any) {
      if (ENABLE_REFRESH_LOGGING) {
        console.log(
          `[RefreshAccessTokenUseCase] Token refresh error: ${error.message}`,
        );
      }
      return err(new AppError.UnexpectedError(error));
    }
  }
}
