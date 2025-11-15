import { Result, ok, err } from 'src/shared/core/Result';
import { UseCase } from 'src/shared/core/UseCase';
import { UseCaseError } from 'src/shared/core/UseCaseError';
import { AppError } from 'src/shared/core/AppError';
import { ICardRepository } from '../../../cards/domain/ICardRepository';
import { IAtUriResolutionService } from '../../../cards/domain/services/IAtUriResolutionService';
import { IEventPublisher } from '../../../shared/application/events/IEventPublisher';
import { CardFactory } from '../../../cards/domain/CardFactory';
import { PublishedRecordId } from '../../../cards/domain/value-objects/PublishedRecordId';
import { CardContent } from '../../../cards/domain/value-objects/CardContent';
import { ATUri } from '../../domain/ATUri';
import { Record as CardRecord } from '../../infrastructure/lexicon/types/network/cosmik/card';

export interface ProcessCardFirehoseEventDTO {
  atUri: string;
  cid: string | null;
  eventType: 'create' | 'update' | 'delete';
  record?: CardRecord;
}

export class ProcessCardFirehoseEventUseCase implements UseCase<ProcessCardFirehoseEventDTO, Result<void>> {
  constructor(
    private cardRepository: ICardRepository,
    private atUriResolutionService: IAtUriResolutionService,
    private eventPublisher: IEventPublisher,
  ) {}

  async execute(request: ProcessCardFirehoseEventDTO): Promise<Result<void>> {
    try {
      console.log(`Processing card firehose event: ${request.atUri} (${request.eventType})`);

      switch (request.eventType) {
        case 'create':
          return await this.handleCardCreate(request);
        case 'update':
          return await this.handleCardUpdate(request);
        case 'delete':
          return await this.handleCardDelete(request);
      }

      return ok(undefined);
    } catch (error) {
      return err(AppError.UnexpectedError.create(error));
    }
  }

  private async handleCardCreate(request: ProcessCardFirehoseEventDTO): Promise<Result<void>> {
    if (!request.record || !request.cid) {
      console.warn('Card create event missing record or cid, skipping');
      return ok(undefined);
    }

    try {
      // Parse AT URI to extract curator DID
      const atUriResult = ATUri.create(request.atUri);
      if (atUriResult.isErr()) {
        console.warn(`Invalid AT URI format: ${request.atUri} - ${atUriResult.error.message}`);
        return ok(undefined);
      }
      const atUri = atUriResult.value;
      const curatorDid = atUri.did.value;

      // Convert AT Protocol record to domain input
      const cardInput = this.mapRecordToCardInput(request.record, request.atUri);
      if (!cardInput) {
        console.warn(`Unable to map card record for ${request.atUri}`);
        return ok(undefined);
      }

      // Create card using existing factory
      const cardResult = CardFactory.create({
        curatorId: curatorDid,
        cardInput: cardInput,
      });

      if (cardResult.isErr()) {
        console.warn(`Failed to create card from firehose event: ${cardResult.error.message}`);
        return ok(undefined);
      }

      const card = cardResult.value;

      // Mark as published with the AT Protocol record ID
      const publishedRecordId = PublishedRecordId.create({
        uri: request.atUri,
        cid: request.cid,
      });
      card.markAsPublished(publishedRecordId);

      // Save to repository
      const saveResult = await this.cardRepository.save(card);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      // Store AT URI mapping for future resolution
      await this.atUriResolutionService.storeCardMapping(request.atUri, card.cardId);

      // Publish domain events
      await this.publishDomainEvents(card);

      console.log(`Successfully created card from firehose event: ${card.cardId.getStringValue()}`);
      return ok(undefined);

    } catch (error) {
      console.error(`Error processing card create event: ${error}`);
      return ok(undefined); // Don't fail the firehose processing
    }
  }

  private async handleCardUpdate(request: ProcessCardFirehoseEventDTO): Promise<Result<void>> {
    if (!request.record || !request.cid) {
      console.warn('Card update event missing record or cid, skipping');
      return ok(undefined);
    }

    // Only handle NOTE card updates for now
    if (request.record.type !== 'NOTE') {
      console.log(`Ignoring update for card type: ${request.record.type}`);
      return ok(undefined);
    }

    try {
      // Resolve existing card
      const cardIdResult = await this.atUriResolutionService.resolveCardId(request.atUri);
      if (cardIdResult.isErr()) {
        console.warn(`Failed to resolve card ID for ${request.atUri}: ${cardIdResult.error.message}`);
        return ok(undefined);
      }

      if (!cardIdResult.value) {
        console.log(`Card not found in our system: ${request.atUri}`);
        return ok(undefined);
      }

      const existingCardResult = await this.cardRepository.findById(cardIdResult.value);
      if (existingCardResult.isErr()) {
        return err(AppError.UnexpectedError.create(existingCardResult.error));
      }

      const existingCard = existingCardResult.value;
      if (!existingCard) {
        console.log(`Card not found: ${cardIdResult.value.getStringValue()}`);
        return ok(undefined);
      }

      // Update card content from record (NOTE cards only)
      if (request.record.content.$type?.includes('noteContent')) {
        const noteContent = request.record.content as any;
        const newContentResult = CardContent.createNoteContent(noteContent.text);
        if (newContentResult.isErr()) {
          console.warn(`Failed to create note content: ${newContentResult.error.message}`);
          return ok(undefined);
        }

        const updateResult = existingCard.updateContent(newContentResult.value);
        if (updateResult.isErr()) {
          console.warn(`Failed to update card content: ${updateResult.error.message}`);
          return ok(undefined);
        }
      }

      // Update published record ID
      const newPublishedRecordId = PublishedRecordId.create({
        uri: request.atUri,
        cid: request.cid,
      });
      existingCard.markAsPublished(newPublishedRecordId);

      // Save updated card
      const saveResult = await this.cardRepository.save(existingCard);
      if (saveResult.isErr()) {
        return err(AppError.UnexpectedError.create(saveResult.error));
      }

      // Publish domain events
      await this.publishDomainEvents(existingCard);

      console.log(`Successfully updated card from firehose event: ${existingCard.cardId.getStringValue()}`);
      return ok(undefined);

    } catch (error) {
      console.error(`Error processing card update event: ${error}`);
      return ok(undefined); // Don't fail the firehose processing
    }
  }

  private async handleCardDelete(request: ProcessCardFirehoseEventDTO): Promise<Result<void>> {
    const cardIdResult = await this.atUriResolutionService.resolveCardId(request.atUri);
    if (cardIdResult.isErr()) {
      return err(AppError.UnexpectedError.create(cardIdResult.error));
    }
    
    if (cardIdResult.value) {
      console.log(`Card deleted externally: ${request.atUri}, removing from our system`);
      const deleteResult = await this.cardRepository.delete(cardIdResult.value);
      if (deleteResult.isErr()) {
        return err(AppError.UnexpectedError.create(deleteResult.error));
      }
    }

    return ok(undefined);
  }

  private mapRecordToCardInput(record: CardRecord, atUri: string): any | null {
    try {
      if (record.type === 'URL' && record.content.$type?.includes('urlContent')) {
        const urlContent = record.content as any;
        return {
          type: 'URL',
          url: urlContent.url,
          metadata: urlContent.metadata ? {
            title: urlContent.metadata.title,
            description: urlContent.metadata.description,
            author: urlContent.metadata.author,
            publishedDate: urlContent.metadata.publishedDate ? new Date(urlContent.metadata.publishedDate) : undefined,
            siteName: urlContent.metadata.siteName,
            imageUrl: urlContent.metadata.imageUrl,
            type: urlContent.metadata.type,
            retrievedAt: urlContent.metadata.retrievedAt ? new Date(urlContent.metadata.retrievedAt) : undefined,
          } : undefined,
        };
      } else if (record.type === 'NOTE' && record.content.$type?.includes('noteContent')) {
        const noteContent = record.content as any;
        return {
          type: 'NOTE',
          text: noteContent.text,
          url: record.url,
          // parentCardId would need to be resolved from parentCard reference if present
        };
      }
      return null;
    } catch (error) {
      console.error(`Error mapping record to card input: ${error}`);
      return null;
    }
  }

  private async publishDomainEvents(card: any): Promise<void> {
    try {
      const events = card.domainEvents || [];
      if (events.length > 0) {
        const publishResult = await this.eventPublisher.publishEvents(events);
        if (publishResult.isErr()) {
          console.error('Failed to publish domain events:', publishResult.error);
        }
        card.clearEvents?.(); // Clear events after publishing if method exists
      }
    } catch (error) {
      console.error('Error publishing domain events:', error);
    }
  }
}
