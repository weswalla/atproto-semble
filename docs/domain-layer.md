# Domain Model Outline (DDD)

This document outlines a potential domain model based on the lexicon definitions, following Domain-Driven Design (DDD) principles and a layered architecture.

## Bounded Contexts

We identify two primary bounded contexts:

1.  **Annotations Context:** Manages the creation, definition, and querying of annotations, annotation fields, and templates.
2.  **ATProto Context:** Deals with the underlying AT Protocol concepts like repositories, records, and strong references. This context primarily provides foundational types and potentially services for resolving references used by the Annotations context.

## Layered Architecture

### 1. Domain Layer

Contains the core business logic, entities, value objects, and aggregates. It is independent of application and infrastructure concerns.

#### Annotations Context

*   **Aggregates & Entities:**
    *   `Annotation` (Aggregate Root):
        *   Entity representing a single annotation instance.
        *   Contains `AnnotationValue` (Value Object) representing the specific data based on the field type.
        *   References `AnnotationField` via `StrongRef` (Value Object from ATProto context).
        *   May reference `AnnotationTemplate`(s) via `StrongRef` (Value Object from ATProto context).
        *   Includes `url` (Value Object - potentially a specific URI type) and optional `additionalIdentifiers` (List of `Identifier` Value Objects).
        *   Includes optional `note` (string).
        *   Root ensures the consistency between the `AnnotationField` reference and the `AnnotationValue` type.
    *   `AnnotationField` (Aggregate Root):
        *   Entity defining the structure and type of an annotation.
        *   Contains `FieldDefinition` (Value Object) which holds the specific configuration (e.g., `DyadFieldDef`, `RatingFieldDef`).
        *   Properties: `name`, `description`, `createdAt`.
        *   Root ensures the validity of the `FieldDefinition`.
    *   `AnnotationTemplate` (Aggregate Root):
        *   Entity grouping multiple `AnnotationField`s.
        *   Properties: `name`, `description`, `createdAt`.
        *   Contains a list of `TemplateField` (Value Object), each holding a `StrongRef` to an `AnnotationField` and a `required` flag.
        *   Root ensures the integrity of the template definition.

*   **Value Objects:**
    *   `AnnotationValue`: Represents the actual value of an annotation. Could be a union/interface implemented by:
        *   `DyadValue` (`value`)
        *   `TriadValue` (`vertexA`, `vertexB`, `vertexC`, `sum`)
        *   `RatingValue` (`rating`)
        *   `SingleSelectValue` (`option`)
        *   `MultiSelectValue` (`option` array)
    *   `FieldDefinition`: Represents the definition of an `AnnotationField`. Could be a union/interface implemented by:
        *   `DyadFieldDef` (`sideA`, `sideB`)
        *   `TriadFieldDef` (`vertexA`, `vertexB`, `vertexC`)
        *   `RatingFieldDef` (`numberOfStars`)
        *   `SingleSelectFieldDef` (`options` array)
        *   `MultiSelectFieldDef` (`options` array)
    *   `TemplateField`: Represents an entry in `AnnotationTemplate.annotationFields`. Contains `fieldRef` (`StrongRef`) and `required` (boolean).
    *   `Identifier`: (`type`, `value`) - Represents `app.annos.defs#identifier`.
    *   `URI`: Represents a validated URI string.

#### ATProto Context (as relevant to Annotations)

*   **Value Objects:**
    *   `StrongRef`: (`cid`, `uri`) - Represents `com.atproto.repo.strongRef`. Used for linking between aggregates/records.
    *   `TID`: Represents a unique record identifier within the ATProto context. (Used as `key` in lexicons).

### 2. Application Layer

Contains application-specific logic, orchestrates use cases, and coordinates domain objects. It depends on the Domain Layer but not the Infrastructure Layer (uses interfaces defined in the domain/application layer).

*   **Use Cases / Application Services:**
    *   `CreateAnnotationUseCase`: Handles creating a new `Annotation` record. Validates input, fetches related `AnnotationField`, creates the `Annotation` aggregate, and uses a repository to persist it.
    *   `GetAnnotationUseCase`: Retrieves an `Annotation` by its identifier.
    *   `CreateAnnotationFieldUseCase`: Handles creating a new `AnnotationField`. Validates definition, creates the aggregate, persists.
    *   `GetAnnotationFieldUseCase`: Retrieves an `AnnotationField`.
    *   `CreateAnnotationTemplateUseCase`: Handles creating a new `AnnotationTemplate`. Validates input, resolves `AnnotationField` references, creates the aggregate, persists.
    *   `GetAnnotationTemplateUseCase`: Retrieves an `AnnotationTemplate`.
    *   `AddAnnotationFieldToTemplateUseCase`: Adds a field reference to an existing template.
    *   `ListAnnotationsForResourceUseCase`: Finds annotations associated with a specific URL or identifier.
    *   *(Other CRUD operations and specific query use cases)*

*   **Data Transfer Objects (DTOs):** Used for input and output of Application Services to decouple from the internal domain model and external interfaces (e.g., API requests/responses).

*   **Repository Interfaces:** (Defined here or in Domain, implemented in Infrastructure)
    *   `IAnnotationRepository`
    *   `IAnnotationFieldRepository`
    *   `IAnnotationTemplateRepository`

### 3. Infrastructure Layer

Contains implementation details for data persistence, external service integrations, UI frameworks, etc. It depends on the Application and Domain Layers.

*   **Persistence (Example: Drizzle ORM):**
    *   Implementation of Repository Interfaces (`AnnotationRepository`, `AnnotationFieldRepository`, `AnnotationTemplateRepository`) using Drizzle ORM.
    *   Defines Drizzle schemas mapping domain entities/aggregates to database tables.
    *   Handles database connections and transactions.
    *   Serializes/deserializes Value Objects (like `AnnotationValue`, `FieldDefinition`, `StrongRef`) for storage.
*   **External Services:**
    *   Clients or adapters for interacting with other ATProto services if needed (e.g., resolving `StrongRef` details if not handled purely by reference).
*   **API / Presentation:**
    *   (e.g., Express.js, Fastify) Handles HTTP requests, uses Application Services (Use Cases) to perform actions, and formats responses (often using DTOs). Maps API routes to use case handlers.

## Interactions

*   The Application Layer orchestrates interactions. For example, `CreateAnnotationUseCase` might fetch an `AnnotationField` using `IAnnotationFieldRepository` to validate the incoming `AnnotationValue` before creating the `Annotation` aggregate and saving it via `IAnnotationRepository`.
*   `StrongRef` Value Objects are used within the Annotations context domain models but their resolution or validation might involve calls (potentially abstracted via interfaces) to ATProto-specific logic or repositories.
