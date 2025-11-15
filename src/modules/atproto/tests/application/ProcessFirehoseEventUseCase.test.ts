import { ProcessFirehoseEventUseCase } from '../../application/useCases/ProcessFirehoseEventUseCase';
import { InMemoryFirehoseEventDuplicationService } from '../utils/InMemoryFirehoseEventDuplicationService';
import { ProcessCardFirehoseEventUseCase } from '../../application/useCases/ProcessCardFirehoseEventUseCase';
import { ProcessCollectionFirehoseEventUseCase } from '../../application/useCases/ProcessCollectionFirehoseEventUseCase';
import { ProcessCollectionLinkFirehoseEventUseCase } from '../../application/useCases/ProcessCollectionLinkFirehoseEventUseCase';
import { EnvironmentConfigService } from '../../../../shared/infrastructure/config/EnvironmentConfigService';
import { Record as CardRecord } from '../../infrastructure/lexicon/types/network/cosmik/card';
import { Record as CollectionRecord } from '../../infrastructure/lexicon/types/network/cosmik/collection';
import { Record as CollectionLinkRecord } from '../../infrastructure/lexicon/types/network/cosmik/collectionLink';

// Mock the specific use cases
jest.mock('../../application/useCases/ProcessCardFirehoseEventUseCase');
jest.mock('../../application/useCases/ProcessCollectionFirehoseEventUseCase');
jest.mock(
  '../../application/useCases/ProcessCollectionLinkFirehoseEventUseCase',
);

const MockProcessCardFirehoseEventUseCase =
  ProcessCardFirehoseEventUseCase as jest.MockedClass<
    typeof ProcessCardFirehoseEventUseCase
  >;
const MockProcessCollectionFirehoseEventUseCase =
  ProcessCollectionFirehoseEventUseCase as jest.MockedClass<
    typeof ProcessCollectionFirehoseEventUseCase
  >;
const MockProcessCollectionLinkFirehoseEventUseCase =
  ProcessCollectionLinkFirehoseEventUseCase as jest.MockedClass<
    typeof ProcessCollectionLinkFirehoseEventUseCase
  >;

describe('ProcessFirehoseEventUseCase', () => {
  let useCase: ProcessFirehoseEventUseCase;
  let duplicationService: InMemoryFirehoseEventDuplicationService;
  let configService: EnvironmentConfigService;
  let mockProcessCardFirehoseEventUseCase: jest.Mocked<ProcessCardFirehoseEventUseCase>;
  let mockProcessCollectionFirehoseEventUseCase: jest.Mocked<ProcessCollectionFirehoseEventUseCase>;
  let mockProcessCollectionLinkFirehoseEventUseCase: jest.Mocked<ProcessCollectionLinkFirehoseEventUseCase>;

  beforeEach(() => {
    duplicationService = new InMemoryFirehoseEventDuplicationService();
    configService = new EnvironmentConfigService();

    // Create mock instances
    mockProcessCardFirehoseEventUseCase =
      new MockProcessCardFirehoseEventUseCase() as any;
    mockProcessCollectionFirehoseEventUseCase =
      new MockProcessCollectionFirehoseEventUseCase() as any;
    mockProcessCollectionLinkFirehoseEventUseCase =
      new MockProcessCollectionLinkFirehoseEventUseCase() as any;

    // Setup default mock implementations
    mockProcessCardFirehoseEventUseCase.execute = jest
      .fn()
      .mockResolvedValue({ isOk: () => true });
    mockProcessCollectionFirehoseEventUseCase.execute = jest
      .fn()
      .mockResolvedValue({ isOk: () => true });
    mockProcessCollectionLinkFirehoseEventUseCase.execute = jest
      .fn()
      .mockResolvedValue({ isOk: () => true });

    useCase = new ProcessFirehoseEventUseCase(
      duplicationService,
      configService,
      mockProcessCardFirehoseEventUseCase,
      mockProcessCollectionFirehoseEventUseCase,
      mockProcessCollectionLinkFirehoseEventUseCase,
    );
  });

  afterEach(() => {
    duplicationService.clear();
    jest.clearAllMocks();
  });

  describe('Event Routing', () => {
    it('should route card events to ProcessCardFirehoseEventUseCase', async () => {
      const collections = configService.getAtProtoCollections();
      const cardRecord: CardRecord = {
        $type: 'network.cosmik.card',
        type: 'URL',
        content: {
          $type: 'network.cosmik.card#urlContent',
          url: 'https://example.com',
        },
      };

      const request = {
        atUri: `at://did:plc:test/${collections.card}/test-card-id`,
        cid: 'test-cid',
        eventType: 'create' as const,
        record: cardRecord,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      expect(mockProcessCardFirehoseEventUseCase.execute).toHaveBeenCalledWith(
        request,
      );
      expect(
        mockProcessCollectionFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
      expect(
        mockProcessCollectionLinkFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it('should route collection events to ProcessCollectionFirehoseEventUseCase', async () => {
      const collections = configService.getAtProtoCollections();
      const collectionRecord: CollectionRecord = {
        $type: 'network.cosmik.collection',
        name: 'Test Collection',
        accessType: 'CLOSED',
      };

      const request = {
        atUri: `at://did:plc:test/${collections.collection}/test-collection-id`,
        cid: 'test-cid',
        eventType: 'create' as const,
        record: collectionRecord,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      expect(
        mockProcessCollectionFirehoseEventUseCase.execute,
      ).toHaveBeenCalledWith(request);
      expect(
        mockProcessCardFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
      expect(
        mockProcessCollectionLinkFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it('should route collection link events to ProcessCollectionLinkFirehoseEventUseCase', async () => {
      const collections = configService.getAtProtoCollections();
      const linkRecord: CollectionLinkRecord = {
        $type: 'network.cosmik.collectionLink',
        collection: {
          uri: 'at://did:plc:test/network.cosmik.collection/collection-id',
          cid: 'collection-cid',
        },
        card: {
          uri: 'at://did:plc:test/network.cosmik.card/card-id',
          cid: 'card-cid',
        },
        addedBy: 'did:plc:test',
        addedAt: new Date().toISOString(),
      };

      const request = {
        atUri: `at://did:plc:test/${collections.collectionLink}/test-link-id`,
        cid: 'test-cid',
        eventType: 'create' as const,
        record: linkRecord,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      expect(
        mockProcessCollectionLinkFirehoseEventUseCase.execute,
      ).toHaveBeenCalledWith(request);
      expect(
        mockProcessCardFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
      expect(
        mockProcessCollectionFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it('should handle unknown collection types', async () => {
      const request = {
        atUri: 'at://did:plc:test/unknown.collection.type/test-id',
        cid: 'test-cid',
        eventType: 'create' as const,
        record: {} as any,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Unknown collection type');
      }
      expect(
        mockProcessCardFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
      expect(
        mockProcessCollectionFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
      expect(
        mockProcessCollectionLinkFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
    });
  });

  describe('Duplicate Detection', () => {
    it('should skip processing duplicate events', async () => {
      const collections = configService.getAtProtoCollections();
      const atUri = `at://did:plc:test/${collections.card}/test-card-id`;
      const cid = 'test-cid';
      const eventType = 'create';

      // Mark event as already processed
      await duplicationService.markEventAsProcessed(atUri, cid, eventType);

      const request = {
        atUri,
        cid,
        eventType: eventType as 'create',
        record: {
          $type: 'network.cosmik.card',
          type: 'URL',
          content: {
            $type: 'network.cosmik.card#urlContent',
            url: 'https://example.com',
          },
        } as CardRecord,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      expect(
        mockProcessCardFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it('should process non-duplicate events', async () => {
      const collections = configService.getAtProtoCollections();
      const request = {
        atUri: `at://did:plc:test/${collections.card}/test-card-id`,
        cid: 'test-cid',
        eventType: 'create' as const,
        record: {
          $type: 'network.cosmik.card',
          type: 'URL',
          content: {
            $type: 'network.cosmik.card#urlContent',
            url: 'https://example.com',
          },
        } as CardRecord,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      expect(mockProcessCardFirehoseEventUseCase.execute).toHaveBeenCalledWith(
        request,
      );
    });

    it('should handle duplication service errors', async () => {
      // Configure duplication service to fail
      duplicationService.setShouldFail(true);

      const collections = configService.getAtProtoCollections();
      const request = {
        atUri: `at://did:plc:test/${collections.card}/test-card-id`,
        cid: 'test-cid',
        eventType: 'create' as const,
        record: {
          $type: 'network.cosmik.card',
          type: 'URL',
          content: {
            $type: 'network.cosmik.card#urlContent',
            url: 'https://example.com',
          },
        } as CardRecord,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      expect(
        mockProcessCardFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
    });
  });

  describe('AT URI Validation', () => {
    it('should handle invalid AT URI format', async () => {
      const request = {
        atUri: 'invalid-uri-format',
        cid: 'test-cid',
        eventType: 'create' as const,
        record: {} as any,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid AT URI');
      }
      expect(
        mockProcessCardFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
      expect(
        mockProcessCollectionFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
      expect(
        mockProcessCollectionLinkFirehoseEventUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it('should handle malformed AT URI', async () => {
      const request = {
        atUri: 'at://did:plc:test', // Missing collection and rkey
        cid: 'test-cid',
        eventType: 'create' as const,
        record: {} as any,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid AT URI');
      }
    });
  });

  describe('Event Types', () => {
    it('should handle create events', async () => {
      const collections = configService.getAtProtoCollections();
      const request = {
        atUri: `at://did:plc:test/${collections.card}/test-card-id`,
        cid: 'test-cid',
        eventType: 'create' as const,
        record: {
          $type: 'network.cosmik.card',
          type: 'URL',
          content: {
            $type: 'network.cosmik.card#urlContent',
            url: 'https://example.com',
          },
        } as CardRecord,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      expect(mockProcessCardFirehoseEventUseCase.execute).toHaveBeenCalledWith(
        request,
      );
    });

    it('should handle update events', async () => {
      const collections = configService.getAtProtoCollections();
      const request = {
        atUri: `at://did:plc:test/${collections.collection}/test-collection-id`,
        cid: 'test-cid',
        eventType: 'update' as const,
        record: {
          $type: 'network.cosmik.collection',
          name: 'Updated Collection',
          accessType: 'OPEN',
        } as CollectionRecord,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      expect(
        mockProcessCollectionFirehoseEventUseCase.execute,
      ).toHaveBeenCalledWith(request);
    });

    it('should handle delete events', async () => {
      const collections = configService.getAtProtoCollections();
      const request = {
        atUri: `at://did:plc:test/${collections.collectionLink}/test-link-id`,
        cid: null, // CID can be null for delete events
        eventType: 'delete' as const,
      };

      const result = await useCase.execute(request);

      expect(result.isOk()).toBe(true);
      expect(
        mockProcessCollectionLinkFirehoseEventUseCase.execute,
      ).toHaveBeenCalledWith(request);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const collections = configService.getAtProtoCollections();

      // Configure card use case to throw an error
      mockProcessCardFirehoseEventUseCase.execute.mockRejectedValue(
        new Error('Unexpected error'),
      );

      const request = {
        atUri: `at://did:plc:test/${collections.card}/test-card-id`,
        cid: 'test-cid',
        eventType: 'create' as const,
        record: {
          $type: 'network.cosmik.card',
          type: 'URL',
          content: {
            $type: 'network.cosmik.card#urlContent',
            url: 'https://example.com',
          },
        } as CardRecord,
      };

      const result = await useCase.execute(request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Unexpected error');
      }
    });

    it('should handle use case returning error results', async () => {
      const collections = configService.getAtProtoCollections();

      // Configure card use case to return an error result
      mockProcessCardFirehoseEventUseCase.execute.mockResolvedValue({
        isOk: () => false,
        isErr: () => true,
        error: new Error('Use case error'),
      } as any);

      const request = {
        atUri: `at://did:plc:test/${collections.card}/test-card-id`,
        cid: 'test-cid',
        eventType: 'create' as const,
        record: {
          $type: 'network.cosmik.card',
          type: 'URL',
          content: {
            $type: 'network.cosmik.card#urlContent',
            url: 'https://example.com',
          },
        } as CardRecord,
      };

      const result = await useCase.execute(request);

      // The specific use cases handle their own errors and return ok(undefined)
      // so this should still be ok from the main processor's perspective
      expect(result.isOk()).toBe(false);
    });
  });
});
