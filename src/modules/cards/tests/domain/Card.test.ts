import { Card } from '../../domain/Card';
import { CardType, CardTypeEnum } from '../../domain/value-objects/CardType';
import { CardContent } from '../../domain/value-objects/CardContent';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { URL } from '../../domain/value-objects/URL';
import { UrlMetadata } from '../../domain/value-objects/UrlMetadata';

describe('Card', () => {
  describe('create', () => {
    it('should automatically add card to curator library when created', () => {
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

      // Verify card is in curator's library
      expect(card.isInLibrary(curatorId)).toBe(true);
      expect(card.libraryMembershipCount).toBe(1);
      expect(card.libraryCount).toBe(1);

      // Verify library membership details
      const libraryInfo = card.getLibraryInfo(curatorId);
      expect(libraryInfo).toBeDefined();
      expect(libraryInfo!.curatorId.equals(curatorId)).toBe(true);
      expect(libraryInfo!.addedAt).toBeInstanceOf(Date);
      expect(libraryInfo!.publishedRecordId).toBeUndefined();
    });

    it('should create note card and add to curator library', () => {
      // Arrange
      const curatorId = CuratorId.create('did:plc:test456').unwrap();
      const cardType = CardType.create(CardTypeEnum.NOTE).unwrap();
      const cardContent = CardContent.createNoteContent(
        'This is a test note',
        curatorId,
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

      // Verify card is in curator's library
      expect(card.isInLibrary(curatorId)).toBe(true);
      expect(card.libraryMembershipCount).toBe(1);
      expect(card.libraryCount).toBe(1);
    });

    it('should respect provided library memberships and count', () => {
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
      expect(result.isOk()).toBe(true);
      const card = result.unwrap();

      // Should have both the existing membership and the new curator membership
      expect(card.libraryMembershipCount).toBe(2);
      expect(card.libraryCount).toBe(2);
      expect(card.isInLibrary(curatorId)).toBe(true);
      expect(card.isInLibrary(otherUserId)).toBe(true);
    });
  });
});
