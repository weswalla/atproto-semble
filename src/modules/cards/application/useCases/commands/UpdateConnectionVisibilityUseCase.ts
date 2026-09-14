import { Result, ok, err } from '../../../../../shared/core/Result';
import { UseCase } from '../../../../../shared/core/UseCase';
import { UseCaseError } from '../../../../../shared/core/UseCaseError';
import { AppError } from '../../../../../shared/core/AppError';
import { IConnectionRepository } from '../../../domain/IConnectionRepository';
import { ConnectionId } from '../../../domain/value-objects/ConnectionId';
import { CuratorId } from '../../../domain/value-objects/CuratorId';
import { IConnectionPublisher } from '../../ports/IConnectionPublisher';
import { AuthenticationError } from '../../../../../shared/core/AuthenticationError';
import { parseVisibility } from '../../../domain/value-objects/Visibility';

export interface UpdateConnectionVisibilityDTO {
  connectionId: string;
  curatorId: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateConnectionVisibilityResponseDTO {
  connectionId: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export class ValidationError extends UseCaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Moves a connection between the curator's public repo and their private
 * library space: unpublish from the old location, flip visibility, republish
 * to the new location, and record the fresh published record id (the semble
 * connection id never changes).
 */
export class UpdateConnectionVisibilityUseCase implements UseCase<
  UpdateConnectionVisibilityDTO,
  Result<
    UpdateConnectionVisibilityResponseDTO,
    ValidationError | AuthenticationError | AppError.UnexpectedError
  >
> {
  constructor(
    private connectionRepository: IConnectionRepository,
    private connectionPublisher: IConnectionPublisher,
  ) {}

  async execute(
    request: UpdateConnectionVisibilityDTO,
  ): Promise<
    Result<
      UpdateConnectionVisibilityResponseDTO,
      ValidationError | AuthenticationError | AppError.UnexpectedError
    >
  > {
    try {
      const curatorIdResult = CuratorId.create(request.curatorId);
      if (curatorIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid curator ID: ${curatorIdResult.error.message}`,
          ),
        );
      }
      const curatorId = curatorIdResult.value;

      const connectionIdResult = ConnectionId.createFromString(
        request.connectionId,
      );
      if (connectionIdResult.isErr()) {
        return err(
          new ValidationError(
            `Invalid connection ID: ${connectionIdResult.error.message}`,
          ),
        );
      }

      const visibilityResult = parseVisibility(request.visibility);
      if (visibilityResult.isErr()) {
        return err(new ValidationError(visibilityResult.error.message));
      }
      const targetVisibility = visibilityResult.value;

      const connectionResult = await this.connectionRepository.findById(
        connectionIdResult.value,
      );
      if (connectionResult.isErr()) {
        return err(AppError.UnexpectedError.create(connectionResult.error));
      }
      const connection = connectionResult.value;
      if (!connection) {
        return err(new ValidationError('Connection not found'));
      }
      if (!connection.curatorId.equals(curatorId)) {
        return err(
          new ValidationError(
            'Only the connection curator can change its visibility',
          ),
        );
      }

      if (connection.visibility === targetVisibility) {
        return ok({
          connectionId: request.connectionId,
          visibility: request.visibility,
        });
      }

      const oldRecordId = connection.publishedRecordId;

      // 1) Unpublish the old record from its current location (the record uri
      //    tells the composite publisher where it lives).
      if (oldRecordId) {
        const unpublishResult =
          await this.connectionPublisher.unpublish(oldRecordId);
        if (unpublishResult.isErr()) {
          if (unpublishResult.error instanceof AuthenticationError) {
            return err(unpublishResult.error);
          }
          return err(
            new ValidationError(
              `Failed to unpublish connection: ${unpublishResult.error.message}`,
            ),
          );
        }
        // Drop the stale record ref so republish creates a fresh record in
        // the new location rather than updating in place.
        connection.markAsUnpublished();
      }

      // 2) Flip visibility on the aggregate.
      const changeResult = connection.changeVisibility(targetVisibility);
      if (changeResult.isErr()) {
        return err(new ValidationError(changeResult.error.message));
      }

      // 3) Republish to the new location and record the new published record id.
      if (oldRecordId) {
        const publishResult =
          await this.connectionPublisher.publish(connection);
        if (publishResult.isErr()) {
          if (publishResult.error instanceof AuthenticationError) {
            return err(publishResult.error);
          }
          return err(
            new ValidationError(
              `Failed to republish connection: ${publishResult.error.message}`,
            ),
          );
        }
        connection.markAsPublished(publishResult.value);
      }

      const saveResult = await this.connectionRepository.save(connection);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      return ok({
        connectionId: request.connectionId,
        visibility: request.visibility,
      });
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }
}
