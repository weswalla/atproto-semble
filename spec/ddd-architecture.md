# DDD Architecture

# 🧩 Domain-Driven Design (DDD) Layered Architecture

This document outlines a layered architecture following Domain-Driven Design (DDD) principles for the Structured Annotation system.

---

## 🧱 Layers Overview

### 🟢 Domain Layer

- Encapsulates business rules and logic
- Includes entities, value objects, aggregates, and domain services
- No dependencies on other layers

### 🟡 Application Layer

- Orchestrates use cases (commands/queries)
- Uses domain objects
- Produces/handles domain events
- Handles validation and error propagation
- Returns `Result`/`Either` objects instead of throwing

### 🔵 Infrastructure Layer

- Concrete implementations: database, cache, messaging, search
- Mappers and adapters between persistence and domain models
- Implements repository interfaces

### 🔴 Presentation Layer

- Controllers, routes, GraphQL resolvers, extension UIs
- Translates external input into use-case input
- Returns use-case output as JSON or UI-rendered state

---

## 📌 Core Domain

The **Structured Annotation** represents the core domain. It captures user interactions for enriching web content through structured metadata, evaluations, tags, reactions, collections, and reusable annotation templates.

---

## 🌐 Bounded Contexts

### 1. Annotation Management

- Responsible for creation, updating, and retrieval of structured annotations linked to webpages.

### 2. Evaluation & Criteria Management

- Manages structured evaluations, criteria definitions, and related scoring mechanisms.

### 3. Tagging & Reactions

- Handles tagging, quick reactions, and related metadata for rapid content categorization.

### 4. Collection Management (Curation)

- Oversees user-generated collections or groupings of annotated content.

### 5. Annotation Template Management

- Manages creation, editing, and sharing of annotation templates and reusable criteria.

### 6. Webpage Management

- Manages information about annotated webpages, including metadata extraction and retrieval.

---

## 📦 Aggregates

### 1. Structured Annotation Aggregate

- **Root:** StructuredAnnotation
- Includes evaluations, tags, reactions, notes, highlights, references to collections, and reference to template.

### 2. Collection Aggregate

- **Root:** Collection
- Includes items (StructuredAnnotations), prioritization, and ordering.

### 3. Evaluation Aggregate

- **Root:** Criterion
- Manages definitions and changes to evaluation criteria.

### 4. Annotation Template Aggregate

- **Root:** AnnotationTemplate
- Defines reusable templates including fields, criteria, tags, single-select and multi-select prompts.

### 5. Webpage Aggregate

- **Root:** Webpage
- Represents annotated webpages, including URL and metadata.

---

## 📬 Domain Events

### Annotation Management

- AnnotationCreated
- AnnotationUpdated
- AnnotationDeleted

### Evaluation Management

- EvaluationAdded
- EvaluationCriteriaUpdated

### Tagging & Reaction Management

- TagAdded
- TagRemoved
- ReactionAdded
- ReactionRemoved

### Collection Management

- CollectionCreated
- CollectionUpdated
- AnnotationAddedToCollection
- AnnotationRemovedFromCollection

### Template Management

- AnnotationTemplateCreated
- AnnotationTemplateUpdated
- AnnotationTemplateDeleted
- CriterionAddedToTemplate
- CriterionRemovedFromTemplate

### Webpage Management

- WebpageRegistered
- WebpageMetadataUpdated

---

## 🔖 Entities

- **StructuredAnnotation**: Identified uniquely, mutable properties.
- **Collection**: Has distinct identity, mutable properties (description, items).
- **Criterion**: Unique definitions of evaluation dimensions, mutable for changes.
- **Tag**: Defined labels used across annotations.
- **AnnotationTemplate**: Identified uniquely, mutable properties (fields, criteria, tags).
- **Webpage**: Represents the webpage content, identified by URL, with mutable metadata.

---

## 📌 Value Objects

- **CriteriaEvaluation**: Immutable numeric/dyadic/triadic evaluation.
- **SingleSelectResponse / MultiSelectResponse**: Immutable selections.
- **Reaction**: Immutable representation of quick user responses (emoji or symbolic).
- **CollectionItem**: Immutable reference within a collection (prioritization/order).

---

## 📁 Repositories

Interfaces for persistence of aggregates:

- **StructuredAnnotationRepository**

  - save(annotation)
  - findById(id)
  - findByUrl(url)

- **CollectionRepository**

  - save(collection)
  - findById(id)
  - findByUserId(userId)

- **CriterionRepository**

  - save(criterion)
  - findById(id)
  - findAll()

- **TagRepository**

  - save(tag)
  - findById(id)
  - findByName(name)

- **AnnotationTemplateRepository**

  - save(template)
  - findById(id)
  - findAll()

- **WebpageRepository**
  - save(webpage)
  - findByUrl(url)

---

## 🚧 Application Services

Services coordinating interactions between repositories and domain logic:

- AnnotationService
- EvaluationService
- TaggingService
- CollectionService
- AnnotationTemplateService
- WebpageService

---

## 🌉 Infrastructure Layer

Implementation of repositories, event handling (message queues), and persistence:

- Database (SQL/NoSQL)
- Event Store (for storing domain events)
- External Integrations (Notification services, indexing/search engines)

---

## 🌟 Presentation/UI Layer

Interaction point with end-users:

- Web Browser Extension (Annotation Form)
- Web Dashboard for reviewing/managing annotations, collections, templates, criteria, and webpages

---

This layered architecture clearly separates domain logic, application services, infrastructure, and user interface layers, following DDD principles to provide maintainability, clarity, and scalability.

## 🔁 Benefits of This Layout

- **Modular:** each bounded context lives independently
- **Scalable:** supports teams working in parallel
- **Testable:** every layer is testable in isolation
- **Clean architecture:** follows separation of concerns and hexagonal principles
