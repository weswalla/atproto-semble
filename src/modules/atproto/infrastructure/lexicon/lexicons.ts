/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from '@atproto/lexicon';
import { type $Typed, is$typed, maybe$typed } from './util.js';

export const schemaDict = {
  NetworkCosmikAnnotation: {
    lexicon: 1,
    id: 'network.cosmik.annotation',
    description: 'A single record type for all annotations.',
    defs: {
      main: {
        type: 'record',
        description: 'A record representing an annotation on a resource.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['url', 'field', 'value'],
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              description:
                'The primary URL identifying the annotated resource.',
            },
            additionalIdentifiers: {
              type: 'array',
              items: {
                type: 'ref',
                ref: 'lex:network.cosmik.defs#identifier',
              },
              description: 'Optional additional identifiers for the resource.',
            },
            field: {
              type: 'ref',
              description:
                'A strong reference to the specific annotation field record being used.',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            fromTemplates: {
              type: 'array',
              items: {
                type: 'ref',
                description:
                  'Optional strong reference to the template record used.',
                ref: 'lex:com.atproto.repo.strongRef',
              },
            },
            note: {
              type: 'string',
              description:
                'An optional user-provided note about the annotation.',
            },
            value: {
              type: 'union',
              description:
                'The specific value of the annotation, determined by the field type.',
              refs: [
                'lex:network.cosmik.annotation#dyadValue',
                'lex:network.cosmik.annotation#triadValue',
                'lex:network.cosmik.annotation#ratingValue',
                'lex:network.cosmik.annotation#singleSelectValue',
                'lex:network.cosmik.annotation#multiSelectValue',
              ],
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Timestamp when this annotation was created (usually set by PDS).',
            },
          },
        },
      },
      dyadValue: {
        type: 'object',
        description: 'Value structure for a dyad annotation.',
        required: ['value'],
        properties: {
          value: {
            type: 'integer',
            description: 'Value representing the relationship between sides',
            minimum: 0,
            maximum: 100,
          },
        },
      },
      triadValue: {
        type: 'object',
        description: 'Value structure for a triad annotation.',
        required: ['vertexA', 'vertexB', 'vertexC'],
        properties: {
          vertexA: {
            type: 'integer',
            description: 'Value for vertex A',
            minimum: 0,
            maximum: 1000,
          },
          vertexB: {
            type: 'integer',
            description: 'Value for vertex B',
            minimum: 0,
            maximum: 1000,
          },
          vertexC: {
            type: 'integer',
            description: 'Value for vertex C',
            minimum: 0,
            maximum: 1000,
          },
          sum: {
            type: 'integer',
            description: 'Sum of the values for the vertices',
            const: 1000,
          },
        },
      },
      ratingValue: {
        type: 'object',
        description: 'Value structure for a rating annotation.',
        required: ['rating'],
        properties: {
          rating: {
            type: 'integer',
            description: 'The star rating value',
            minimum: 1,
            maximum: 10,
          },
        },
      },
      singleSelectValue: {
        type: 'object',
        description: 'Value structure for a single-select annotation.',
        required: ['option'],
        properties: {
          option: {
            type: 'string',
            description: 'The selected option',
          },
        },
      },
      multiSelectValue: {
        type: 'object',
        description: 'Value structure for a multi-select annotation.',
        required: ['options'],
        properties: {
          options: {
            type: 'array',
            description: 'The selected options',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
  },
  NetworkCosmikAnnotationField: {
    lexicon: 1,
    id: 'network.cosmik.annotationField',
    description: 'A single record type for all annotation fields.',
    defs: {
      main: {
        type: 'record',
        description: 'A record defining an annotation field.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'description', 'definition'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of the annotation field',
            },
            description: {
              type: 'string',
              description: 'Description of the annotation field',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp when this field was created',
            },
            definition: {
              type: 'union',
              description:
                'The specific definition of the field, determining its type and constraints.',
              refs: [
                'lex:network.cosmik.annotationField#dyadFieldDef',
                'lex:network.cosmik.annotationField#triadFieldDef',
                'lex:network.cosmik.annotationField#ratingFieldDef',
                'lex:network.cosmik.annotationField#singleSelectFieldDef',
                'lex:network.cosmik.annotationField#multiSelectFieldDef',
              ],
            },
          },
        },
      },
      dyadFieldDef: {
        type: 'object',
        description: 'Definition structure for a dyad field.',
        required: ['sideA', 'sideB'],
        properties: {
          sideA: {
            type: 'string',
            description: 'Label for side A of the dyad',
          },
          sideB: {
            type: 'string',
            description: 'Label for side B of the dyad',
          },
        },
      },
      triadFieldDef: {
        type: 'object',
        description: 'Definition structure for a triad field.',
        required: ['vertexA', 'vertexB', 'vertexC'],
        properties: {
          vertexA: {
            type: 'string',
            description: 'Label for vertex A of the triad',
          },
          vertexB: {
            type: 'string',
            description: 'Label for vertex B of the triad',
          },
          vertexC: {
            type: 'string',
            description: 'Label for vertex C of the triad',
          },
        },
      },
      ratingFieldDef: {
        type: 'object',
        description: 'Definition structure for a rating field.',
        required: ['numberOfStars'],
        properties: {
          numberOfStars: {
            type: 'integer',
            description: 'Maximum number of stars for the rating',
            const: 5,
          },
        },
      },
      singleSelectFieldDef: {
        type: 'object',
        description: 'Definition structure for a single-select field.',
        required: ['options'],
        properties: {
          options: {
            type: 'array',
            description: 'Available options for selection',
            items: {
              type: 'string',
            },
          },
        },
      },
      multiSelectFieldDef: {
        type: 'object',
        description: 'Definition structure for a multi-select field.',
        required: ['options'],
        properties: {
          options: {
            type: 'array',
            description: 'Available options for selection',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
  },
  NetworkCosmikAnnotationTemplate: {
    lexicon: 1,
    id: 'network.cosmik.annotationTemplate',
    description: 'Annotation templates for grouping annotation fields',
    defs: {
      main: {
        type: 'record',
        description: 'A record of an annotation template',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'description', 'annotationFields'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of the template',
            },
            description: {
              type: 'string',
              description: 'Description of the template',
            },
            annotationFields: {
              type: 'array',
              description:
                'List of strong references to network.cosmik.annotationField records included in this template.',
              items: {
                type: 'ref',
                ref: 'lex:network.cosmik.annotationTemplate#annotationFieldRef',
              },
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp when this template was created',
            },
          },
        },
      },
      annotationFieldRef: {
        type: 'object',
        description:
          'A reference to an annotation field. Defines if the field is required in the template.',
        required: ['subject'],
        properties: {
          subject: {
            type: 'ref',
            ref: 'lex:com.atproto.repo.strongRef',
          },
          required: {
            type: 'boolean',
          },
        },
      },
    },
  },
  NetworkCosmikCard: {
    lexicon: 1,
    id: 'network.cosmik.card',
    description: 'A single record type for all cards.',
    defs: {
      main: {
        type: 'record',
        description: 'A record representing a card with content.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['type', 'content'],
          properties: {
            type: {
              type: 'string',
              description: 'The type of card',
              knownValues: ['URL', 'NOTE'],
            },
            content: {
              type: 'union',
              description:
                'The specific content of the card, determined by the card type.',
              refs: [
                'lex:network.cosmik.card#urlContent',
                'lex:network.cosmik.card#noteContent',
              ],
            },
            url: {
              type: 'string',
              format: 'uri',
              description:
                'Optional URL associated with the card. Required for URL cards, optional for NOTE cards.',
            },
            parentCard: {
              type: 'ref',
              description:
                'Optional strong reference to a parent card (for NOTE cards).',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Timestamp when this card was created (usually set by PDS).',
            },
            originalCard: {
              type: 'ref',
              description:
                'Optional strong reference to the original card (for NOTE cards).',
              ref: 'lex:com.atproto.repo.strongRef',
            },
          },
        },
      },
      urlContent: {
        type: 'object',
        description: 'Content structure for a URL card.',
        required: ['url'],
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'The URL being saved',
          },
          metadata: {
            type: 'ref',
            ref: 'lex:network.cosmik.card#urlMetadata',
            description: 'Optional metadata about the URL',
          },
        },
      },
      noteContent: {
        type: 'object',
        description: 'Content structure for a note card.',
        required: ['text'],
        properties: {
          text: {
            type: 'string',
            description: 'The note text content',
            maxLength: 10000,
          },
        },
      },
      urlMetadata: {
        type: 'object',
        description: 'Metadata about a URL.',
        required: ['url'],
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'The URL',
          },
          title: {
            type: 'string',
            description: 'Title of the page',
          },
          description: {
            type: 'string',
            description: 'Description of the page',
          },
          author: {
            type: 'string',
            description: 'Author of the content',
          },
          publishedDate: {
            type: 'string',
            format: 'datetime',
            description: 'When the content was published',
          },
          siteName: {
            type: 'string',
            description: 'Name of the site',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
            description: 'URL of a representative image',
          },
          type: {
            type: 'string',
            description: "Type of content (e.g., 'video', 'article')",
          },
          retrievedAt: {
            type: 'string',
            format: 'datetime',
            description: 'When the metadata was retrieved',
          },
        },
      },
    },
  },
  NetworkCosmikCollection: {
    lexicon: 1,
    id: 'network.cosmik.collection',
    description: 'A single record type for collections of cards.',
    defs: {
      main: {
        type: 'record',
        description: 'A record representing a collection of cards.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'accessType'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of the collection',
              maxLength: 100,
            },
            description: {
              type: 'string',
              description: 'Description of the collection',
              maxLength: 500,
            },
            accessType: {
              type: 'string',
              description: 'Access control for the collection',
              knownValues: ['OPEN', 'CLOSED'],
            },
            collaborators: {
              type: 'array',
              description:
                'List of collaborator DIDs who can add cards to closed collections',
              items: {
                type: 'string',
                description: 'DID of a collaborator',
              },
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Timestamp when this collection was created (usually set by PDS).',
            },
            updatedAt: {
              type: 'string',
              format: 'datetime',
              description: 'Timestamp when this collection was last updated.',
            },
          },
        },
      },
    },
  },
  NetworkCosmikCollectionLink: {
    lexicon: 1,
    id: 'network.cosmik.collectionLink',
    description: 'A record that links a card to a collection.',
    defs: {
      main: {
        type: 'record',
        description:
          'A record representing the relationship between a card and a collection.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['collection', 'card', 'addedBy'],
          properties: {
            collection: {
              type: 'ref',
              description: 'Strong reference to the collection record.',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            card: {
              type: 'ref',
              description: 'Strong reference to the card record.',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            addedBy: {
              type: 'string',
              description:
                'DID of the user who added the card to the collection',
            },
            addedAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Timestamp when the card was added to the collection.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Timestamp when this link record was created (usually set by PDS).',
            },
          },
        },
      },
    },
  },
  NetworkCosmikDefs: {
    lexicon: 1,
    id: 'network.cosmik.defs',
    description: 'Common definitions for annotation types and references',
    defs: {
      identifier: {
        type: 'object',
        description: 'Represents an identifier with a type and value.',
        required: ['type', 'value'],
        properties: {
          type: {
            type: 'string',
            description:
              "The type of identifier (e.g., 'doi', 'at-uri', 'isbn').",
          },
          value: {
            type: 'string',
            description: 'The identifier value.',
          },
        },
      },
    },
  },
  ComAtprotoRepoStrongRef: {
    lexicon: 1,
    id: 'com.atproto.repo.strongRef',
    description: 'A URI with a content-hash fingerprint.',
    defs: {
      main: {
        type: 'object',
        required: ['uri', 'cid'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          uri: {
            type: 'string',
            format: 'at-uri',
          },
        },
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>;
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[];
export const lexicons: Lexicons = new Lexicons(schemas);

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>;
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>;
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === 'main' ? id : `${id}#${hash}`}" $type property`,
        ),
      };
}

export const ids = {
  NetworkCosmikAnnotation: 'network.cosmik.annotation',
  NetworkCosmikAnnotationField: 'network.cosmik.annotationField',
  NetworkCosmikAnnotationTemplate: 'network.cosmik.annotationTemplate',
  NetworkCosmikCard: 'network.cosmik.card',
  NetworkCosmikCollection: 'network.cosmik.collection',
  NetworkCosmikCollectionLink: 'network.cosmik.collectionLink',
  NetworkCosmikDefs: 'network.cosmik.defs',
  ComAtprotoRepoStrongRef: 'com.atproto.repo.strongRef',
} as const;
