import { UpdateConnectionVisibilityUseCase } from '../../application/useCases/commands/UpdateConnectionVisibilityUseCase';
import { CreateConnectionUseCase } from '../../application/useCases/commands/CreateConnectionUseCase';
import { InMemoryConnectionRepository } from '../utils/InMemoryConnectionRepository';
import { FakeConnectionPublisher } from '../utils/FakeConnectionPublisher';
import { FakeEventPublisher } from '../utils/FakeEventPublisher';
import { FakeMetadataService } from '../utils/FakeMetadataService';
import { UrlOrCardIdType } from '../../domain/value-objects/UrlOrCardId';
import { ConnectionId } from '../../domain/value-objects/ConnectionId';
import { Connection } from '../../domain/Connection';

const CURATOR = 'did:plc:testcurator123456789';

describe('UpdateConnectionVisibilityUseCase', () => {
  let useCase: UpdateConnectionVisibilityUseCase;
  let createUseCase: CreateConnectionUseCase;
  let connectionRepository: InMemoryConnectionRepository;
  let connectionPublisher: FakeConnectionPublisher;

  beforeEach(() => {
    connectionRepository = InMemoryConnectionRepository.getInstance();
    connectionRepository.clear();
    connectionPublisher = new FakeConnectionPublisher();

    useCase = new UpdateConnectionVisibilityUseCase(
      connectionRepository,
      connectionPublisher,
    );
    createUseCase = new CreateConnectionUseCase(
      connectionRepository,
      connectionPublisher,
      new FakeMetadataService(),
      new FakeEventPublisher(),
    );
  });

  async function createConnection(isPrivate = false): Promise<Connection> {
    const result = await createUseCase.execute({
      sourceType: UrlOrCardIdType.URL,
      sourceValue: 'https://example.com/a',
      targetType: UrlOrCardIdType.URL,
      targetValue: 'https://example.com/b',
      curatorId: CURATOR,
      isPrivate,
    });
    expect(result.isOk()).toBe(true);
    return (
      await connectionRepository.findById(
        ConnectionId.createFromString(result.unwrap().connectionId).unwrap(),
      )
    ).unwrap()!;
  }

  it('public→private: unpublishes the repo record and republishes into the library space', async () => {
    const connection = await createConnection();
    const oldUri = connection.publishedRecordId!.uri;

    const result = await useCase.execute({
      connectionId: connection.connectionId.getStringValue(),
      curatorId: CURATOR,
      visibility: 'PRIVATE',
    });
    expect(result.isOk()).toBe(true);

    const updated = (
      await connectionRepository.findById(connection.connectionId)
    ).unwrap()!;
    expect(updated.isPrivate).toBe(true);
    expect(updated.publishedRecordId!.uri).toContain('/space/');
    expect(updated.publishedRecordId!.uri).not.toBe(oldUri);
    expect(
      connectionPublisher
        .getUnpublishedConnections()
        .find((record) => record.uri === oldUri),
    ).toBeDefined();
  });

  it('private→public: unpublishes the space record and republishes to the repo', async () => {
    const connection = await createConnection(true);
    const oldUri = connection.publishedRecordId!.uri;
    expect(oldUri).toContain('/space/');

    const result = await useCase.execute({
      connectionId: connection.connectionId.getStringValue(),
      curatorId: CURATOR,
      visibility: 'PUBLIC',
    });
    expect(result.isOk()).toBe(true);

    const updated = (
      await connectionRepository.findById(connection.connectionId)
    ).unwrap()!;
    expect(updated.isPublic).toBe(true);
    expect(updated.publishedRecordId!.uri).not.toContain('/space/');
    expect(
      connectionPublisher
        .getUnpublishedConnections()
        .find((record) => record.uri === oldUri),
    ).toBeDefined();
  });

  it('is a no-op when the visibility already matches', async () => {
    const connection = await createConnection();
    const result = await useCase.execute({
      connectionId: connection.connectionId.getStringValue(),
      curatorId: CURATOR,
      visibility: 'PUBLIC',
    });
    expect(result.isOk()).toBe(true);
    expect(connectionPublisher.getUnpublishedConnections()).toHaveLength(0);
  });

  it('only the curator can change visibility', async () => {
    const connection = await createConnection();
    const result = await useCase.execute({
      connectionId: connection.connectionId.getStringValue(),
      curatorId: 'did:plc:someoneelse',
      visibility: 'PRIVATE',
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('curator');
    }
  });

  it('rejects an unknown connection', async () => {
    const result = await useCase.execute({
      connectionId: '00000000-0000-4000-8000-000000000000',
      curatorId: CURATOR,
      visibility: 'PRIVATE',
    });
    expect(result.isErr()).toBe(true);
  });
});
