/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from '@atproto/lexicon'
import { type $Typed, is$typed, maybe$typed } from './util.js'

export const schemaDict = {
  AppAnnosAnnotation: {
    lexicon: 1,
    id: 'app.annos.annotation',
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
                ref: 'lex:app.annos.defs#identifier',
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
                'lex:app.annos.annotation#dyadValue',
                'lex:app.annos.annotation#triadValue',
                'lex:app.annos.annotation#ratingValue',
                'lex:app.annos.annotation#singleSelectValue',
                'lex:app.annos.annotation#multiSelectValue',
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
        required: ['option'],
        properties: {
          option: {
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
  AppAnnosAnnotationField: {
    lexicon: 1,
    id: 'app.annos.annotationField',
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
                'lex:app.annos.annotationField#dyadFieldDef',
                'lex:app.annos.annotationField#triadFieldDef',
                'lex:app.annos.annotationField#ratingFieldDef',
                'lex:app.annos.annotationField#singleSelectFieldDef',
                'lex:app.annos.annotationField#multiSelectFieldDef',
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
  AppAnnosAnnotationTemplate: {
    lexicon: 1,
    id: 'app.annos.annotationTemplate',
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
                'List of strong references to app.annos.annotationField records included in this template.',
              items: {
                type: 'ref',
                ref: 'lex:app.annos.annotationTemplate#annotationFieldRef',
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
        required: ['ref'],
        properties: {
          ref: {
            type: 'ref',
            ref: 'lex:app.annos.annotationField',
          },
          required: {
            type: 'boolean',
            description: 'Indicates if this field is required in the template.',
          },
        },
      },
    },
  },
  AppAnnosDefs: {
    lexicon: 1,
    id: 'app.annos.defs',
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
} as const satisfies Record<string, LexiconDoc>
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>
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
      }
}

export const ids = {
  AppAnnosAnnotation: 'app.annos.annotation',
  AppAnnosAnnotationField: 'app.annos.annotationField',
  AppAnnosAnnotationTemplate: 'app.annos.annotationTemplate',
  AppAnnosDefs: 'app.annos.defs',
  ComAtprotoRepoStrongRef: 'com.atproto.repo.strongRef',
} as const
