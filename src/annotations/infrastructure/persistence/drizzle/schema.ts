// Placeholder for Drizzle ORM schema definitions
// Example using pgTable from 'drizzle-orm/pg-core'

import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  text,
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// --- ATProto Shared ---
// (Could live in src/atproto/infrastructure/persistence/drizzle/schema.ts)
// Assuming TID is stored as text for simplicity here
export const strongRefs = pgTable('strong_refs', {
  uri: text('uri').primaryKey(), // AT URI is the primary key
  cid: varchar('cid', { length: 256 }).notNull(),
  // Add createdAt/updatedAt if needed
})

// --- Annotations Context ---

export const annotationFields = pgTable('annotation_fields', {
  uri: text('uri').primaryKey(), // AT URI of the record
  tid: text('tid').notNull().unique(), // TID part of the URI
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description').notNull(),
  definition: jsonb('definition').notNull(), // Stores FieldDefinition JSON
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const annotationTemplates = pgTable('annotation_templates', {
  uri: text('uri').primaryKey(), // AT URI of the record
  tid: text('tid').notNull().unique(), // TID part of the URI
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Join table for Template <-> Field relationship
export const annotationTemplateFields = pgTable(
  'annotation_template_fields',
  {
    templateUri: text('template_uri')
      .notNull()
      .references(() => annotationTemplates.uri),
    fieldUri: text('field_uri')
      .notNull()
      .references(() => annotationFields.uri),
    required: boolean('required').default(false).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.templateUri, table.fieldUri] }),
    }
  },
)

export const annotations = pgTable('annotations', {
  uri: text('uri').primaryKey(), // AT URI of the record
  tid: text('tid').notNull().unique(), // TID part of the URI
  url: text('url').notNull(), // The annotated resource URL/URI
  fieldUri: text('field_uri')
    .notNull()
    .references(() => annotationFields.uri),
  value: jsonb('value').notNull(), // Stores AnnotationValue JSON
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Join table for Annotation <-> Template relationship (fromTemplates)
export const annotationFromTemplates = pgTable(
  'annotation_from_templates',
  {
    annotationUri: text('annotation_uri')
      .notNull()
      .references(() => annotations.uri),
    templateUri: text('template_uri')
      .notNull()
      .references(() => annotationTemplates.uri),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.annotationUri, table.templateUri] }),
    }
  },
)

// Join table for Annotation <-> Identifier relationship (additionalIdentifiers)
export const annotationIdentifiers = pgTable(
  'annotation_identifiers',
  {
    annotationUri: text('annotation_uri')
      .notNull()
      .references(() => annotations.uri),
    type: varchar('type', { length: 100 }).notNull(),
    value: text('value').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.annotationUri, table.type, table.value] }), // Composite key
    }
  },
)


// --- Drizzle Relations ---

export const annotationFieldRelations = relations(annotationFields, ({ many }) => ({
  templateFields: many(annotationTemplateFields), // Fields can be in many templates
  annotations: many(annotations), // Fields can be used by many annotations
}))

export const annotationTemplateRelations = relations(annotationTemplates, ({ many }) => ({
  templateFields: many(annotationTemplateFields), // Templates have many fields
  annotationsViaTemplate: many(annotationFromTemplates), // Templates can be referenced by annotations
}))

export const annotationTemplateFieldsRelations = relations(annotationTemplateFields, ({ one }) => ({
  template: one(annotationTemplates, {
    fields: [annotationTemplateFields.templateUri],
    references: [annotationTemplates.uri],
  }),
  field: one(annotationFields, {
    fields: [annotationTemplateFields.fieldUri],
    references: [annotationFields.uri],
  }),
}))

export const annotationRelations = relations(annotations, ({ one, many }) => ({
  field: one(annotationFields, {
    fields: [annotations.fieldUri],
    references: [annotationFields.uri],
  }),
  fromTemplates: many(annotationFromTemplates),
  additionalIdentifiers: many(annotationIdentifiers),
}))

export const annotationFromTemplatesRelations = relations(annotationFromTemplates, ({ one }) => ({
  annotation: one(annotations, {
    fields: [annotationFromTemplates.annotationUri],
    references: [annotations.uri],
  }),
  template: one(annotationTemplates, {
    fields: [annotationFromTemplates.templateUri],
    references: [annotationTemplates.uri],
  }),
}))

export const annotationIdentifiersRelations = relations(annotationIdentifiers, ({ one }) => ({
  annotation: one(annotations, {
    fields: [annotationIdentifiers.annotationUri],
    references: [annotations.uri],
  }),
}))

// Note: Relations for strongRefs might be needed if you want to easily query
// based on CIDs or link them directly in Drizzle.
