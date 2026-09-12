import { Card } from '../../domain/Card';
import { Visibility } from '../../domain/value-objects/Visibility';
import { CardType, CardTypeEnum } from '../../domain/value-objects/CardType';
import { CardContent } from '../../domain/value-objects/CardContent';
import { CuratorId } from '../../domain/value-objects/CuratorId';
import { URL } from '../../domain/value-objects/URL';
import { CardFactory } from '../../domain/CardFactory';
import { UrlMetadata } from '../../domain/value-objects/UrlMetadata';

function makeUrlCard(visibility?: Visibility) {
  const curatorId = CuratorId.create('did:plc:testcurator').unwrap();
  const url = URL.create('https://example.com').unwrap();
  const content = CardContent.createUrlContent(url, undefined).unwrap();
  return Card.create({
    curatorId,
    type: CardType.create(CardTypeEnum.URL).unwrap(),
    content,
    url,
    ...(visibility ? { visibility } : {}),
  });
}

describe('Card visibility', () => {
  it('defaults to PUBLIC', () => {
    const card = makeUrlCard().unwrap();
    expect(card.visibility).toBe(Visibility.PUBLIC);
    expect(card.isPublic).toBe(true);
    expect(card.isPrivate).toBe(false);
  });

  it('can be created PRIVATE', () => {
    const card = makeUrlCard(Visibility.PRIVATE).unwrap();
    expect(card.isPrivate).toBe(true);
  });

  it('changeVisibility flips visibility and bumps updatedAt', () => {
    const card = makeUrlCard().unwrap();
    const before = card.updatedAt;
    const result = card.changeVisibility(Visibility.PRIVATE);
    expect(result.isOk()).toBe(true);
    expect(card.isPrivate).toBe(true);
    expect(card.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('changeVisibility to the current value is a no-op ok', () => {
    const card = makeUrlCard().unwrap();
    expect(card.changeVisibility(Visibility.PUBLIC).isOk()).toBe(true);
    expect(card.isPublic).toBe(true);
  });
});

describe('CardFactory visibility', () => {
  it('creates a private card when visibility is PRIVATE', () => {
    const card = CardFactory.create({
      curatorId: 'did:plc:testcurator',
      cardInput: {
        type: CardTypeEnum.URL,
        url: 'https://example.com',
        metadata: UrlMetadata.create({ url: 'https://example.com' }).unwrap(),
      },
      visibility: Visibility.PRIVATE,
    }).unwrap();
    expect(card.isPrivate).toBe(true);
  });

  it('defaults to PUBLIC when visibility is omitted', () => {
    const card = CardFactory.create({
      curatorId: 'did:plc:testcurator',
      cardInput: {
        type: CardTypeEnum.URL,
        url: 'https://example.com',
        metadata: UrlMetadata.create({ url: 'https://example.com' }).unwrap(),
      },
    }).unwrap();
    expect(card.isPublic).toBe(true);
  });
});
