import { UseCase } from 'src/shared/core/UseCase';
import { Result, err, ok } from 'src/shared/core/Result';
import { AppError } from 'src/shared/core/AppError';
import { ITokenService } from '../services/ITokenService';
import { TokenPair } from '../dtos/TokenDTO';
import { RefreshAccessTokenErrors } from './errors/RefreshAccessTokenErrors';

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
      const tokenResult = await this.tokenService.refreshToken(
        request.refreshToken,
      );

      if (tokenResult.isErr()) {
        return err(new AppError.UnexpectedError(tokenResult.error));
      }

      if (!tokenResult.value) {
        return err(new RefreshAccessTokenErrors.InvalidRefreshTokenError());
      }

      return ok(tokenResult.value);
    } catch (error: any) {
      return err(new AppError.UnexpectedError(error));
    }
  }
}
