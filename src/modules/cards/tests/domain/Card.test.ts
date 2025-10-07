import { Card } from '../../domain/Card';
import { CardType, CardTypeEnum } from '../../domain/value-objects/CardType';
import { CardContent } from '../../domain/value-objects/CardContent';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { URL } from '../../domain/value-objects/URL';
import { UrlMetadata } from '../../domain/value-objects/UrlMetadata';

describe('Card', () => {
  describe('create', () => {
    it('should create URL card without automatically adding to library', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test123').unwrap();
      const cardType = CardType.create(CardTypeEnum.URL).unwrap();
      const url = URL.create('https://example.com').unwrap();
      const cardContent = CardContent.createUrlContent(
        url,
        UrlMetadata.create({
          url: url.toString(),
          title: 'Test Title',
          description: 'Test Description',
        }).unwrap(),
      ).unwrap();

      // Act
      const result = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
        url,
      });

      // Assert
      expect(result.isOk()).toBe(true);
      const card = result.unwrap();

      // Verify card is NOT automatically in curator's library
      expect(card.isInLibrary(curatorId)).toBe(false);
      expect(card.libraryMembershipCount).toBe(0);
      expect(card.libraryCount).toBe(0);
    });

    it('should create note card without automatically adding to library', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test456').unwrap();
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent(
        'This is a test note',
      ).unwrap();

      // Act
      const result = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
      });

      // Assert
      expect(result.isOk()).toBe(true);
      const card = result.unwrap();

      // Verify card is NOT automatically in curator's library
      expect(card.isInLibrary(curatorId)).toBe(false);
      expect(card.libraryMembershipCount).toBe(0);
      expect(card.libraryCount).toBe(0);
    });

    it('should fail to create URL card with library membership different from creator', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test789').unwrap();
      const otherUserId = CuratorId.create('did:plc:other123').unwrap();
      const cardType = CardType.create(CardTypeEnum.URL).unwrap();
      const url = URL.create('https://example.com').unwrap();
      const cardContent = CardContent.createUrlContent(
        url,
        UrlMetadata.create({
          url: url.toString(),
          title: 'Test Title',
          description: 'Test Description',
        }).unwrap(),
      ).unwrap();

      const existingMemberships = [
        {
          curatorId: otherUserId,
          addedAt: new Date('2023-01-01'),
          publishedRecordId: undefined,
        },
      ];

      // Act
      const result = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
        url,
        libraryMemberships: existingMemberships,
        libraryCount: 1,
      });

      // Assert
      if (result.isOk()) {
        throw new Error('Expected creation to fail but it succeeded');
      }
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toBe(
        'URL cards can only be in the library of the creator',
      );
    });

    it('should fail to create URL card with multiple library memberships', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test789').unwrap();
      const otherUserId1 = CuratorId.create('did:plc:other123').unwrap();
      const otherUserId2 = CuratorId.create('did:plc:other456').unwrap();
      const cardType = CardType.create(CardTypeEnum.URL).unwrap();
      const url = URL.create('https://example.com').unwrap();
      const cardContent = CardContent.createUrlContent(
        url,
        UrlMetadata.create({
          url: url.toString(),
          title: 'Test Title',
          description: 'Test Description',
        }).unwrap(),
      ).unwrap();

      const existingMemberships = [
        {
          curatorId: otherUserId1,
          addedAt: new Date('2023-01-01'),
          publishedRecordId: undefined,
        },
        {
          curatorId: otherUserId2,
          addedAt: new Date('2023-01-02'),
          publishedRecordId: undefined,
        },
      ];

      // Act
      const result = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
        url,
        libraryMemberships: existingMemberships,
        libraryCount: 2,
      });

      // Assert
      if (result.isOk()) {
        throw new Error('Expected creation to fail but it succeeded');
      }
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toBe('URL cards can only be in one library');
    });

    it('should allow NOTE cards to have multiple library memberships', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test789').unwrap();
      const otherUserId = CuratorId.create('did:plc:other123').unwrap();
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent(
        'This is a test note',
      ).unwrap();

      const existingMemberships = [
        {
          curatorId: otherUserId,
          addedAt: new Date('2023-01-01'),
          publishedRecordId: undefined,
        },
      ];

      // Act
      const result = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
        libraryMemberships: existingMemberships,
        libraryCount: 1,
      });

      // Assert
      expect(result.isOk()).toBe(true);
      const card = result.unwrap();

      // Should have only the existing membership (no automatic curator addition)
      expect(card.libraryMembershipCount).toBe(1);
      expect(card.libraryCount).toBe(1);
      expect(card.isInLibrary(curatorId)).toBe(false);
      expect(card.isInLibrary(otherUserId)).toBe(true);
    });
  });

  describe('addToLibrary', () => {
    it('should allow adding URL card to first library', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test123').unwrap();
      const cardType = CardType.create(CardTypeEnum.URL).unwrap();
      const url = URL.create('https://example.com').unwrap();
      const cardContent = CardContent.createUrlContent(
        url,
        UrlMetadata.create({
          url: url.toString(),
          title: 'Test Title',
          description: 'Test Description',
        }).unwrap(),
      ).unwrap();

      const card = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
        url,
      }).unwrap();

      // Act - add to curator's library
      const result = card.addToLibrary(curatorId);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(card.libraryMembershipCount).toBe(1);
      expect(card.isInLibrary(curatorId)).toBe(true);
    });

    it('should prevent adding URL card to multiple libraries', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test123').unwrap();
      const otherUserId = CuratorId.create('did:plc:other456').unwrap();
      const cardType = CardType.create(CardTypeEnum.URL).unwrap();
      const url = URL.create('https://example.com').unwrap();
      const cardContent = CardContent.createUrlContent(
        url,
        UrlMetadata.create({
          url: url.toString(),
          title: 'Test Title',
          description: 'Test Description',
        }).unwrap(),
      ).unwrap();

      const card = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
        url,
      }).unwrap();

      // First add to curator's library
      card.addToLibrary(curatorId);

      // Act - try to add to another user's library
      const result = card.addToLibrary(otherUserId);

      // Assert
      if (result.isOk()) {
        throw new Error('Expected creation to fail but it succeeded');
      }
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toBe('URL cards can only be in one library');
      expect(card.libraryMembershipCount).toBe(1);
      expect(card.isInLibrary(curatorId)).toBe(true);
      expect(card.isInLibrary(otherUserId)).toBe(false);
    });

    it('should allow adding NOTE card to multiple libraries', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test123').unwrap();
      const otherUserId = CuratorId.create('did:plc:other456').unwrap();
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent(
        'This is a test note',
      ).unwrap();

      const card = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
      }).unwrap();

      // Act - add to both libraries
      const result1 = card.addToLibrary(curatorId);
      const result2 = card.addToLibrary(otherUserId);

      // Assert
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      expect(card.libraryMembershipCount).toBe(2);
      expect(card.isInLibrary(curatorId)).toBe(true);
      expect(card.isInLibrary(otherUserId)).toBe(true);
    });

    it('should prevent adding same user twice to any card type', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test123').unwrap();
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent(
        'This is a test note',
      ).unwrap();

      const card = Card.create({
        curatorId,
        type: cardType,
        content: cardContent,
      }).unwrap();

      // First add to library
      card.addToLibrary(curatorId);

      // Act - try to add same user again
      const result = card.addToLibrary(curatorId);

      // Assert
      if (result.isOk()) {
        throw new Error('Expected creation to fail but it succeeded');
      }
      expect(result.isErr()).toBe(true);
      expect(result.error.message).toBe("Card is already in user's library");
      expect(card.libraryMembershipCount).toBe(1);
    });
  });
});
