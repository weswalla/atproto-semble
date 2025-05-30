# Card Subdomain (DDD)

This document outlines the domain model for the Card feature, following Domain-Driven Design principles.

## Bounded Context

The Card context represents a system where users can save various types of content (URLs, notes, highlights, screenshots, files) to their personal libraries and collections.

## Domain Model

### Aggregates

1. **Card Aggregate**
   - Represents a saveable item (URL, note, highlight, screenshot, file)
   - Responsible for maintaining its own integrity
   - Contains references to related cards (highlights, notes, screenshots)
   - Does NOT directly manage which collections it belongs to

2. **Collection Aggregate**
   - Represents a user-defined grouping of cards
   - Manages which cards belong to it
   - Responsible for maintaining collection membership

3. **Library Aggregate**
   - Represents a user's entire saved content
   - Acts as the top-level container for a user's cards
   - May contain references to collections

### Entities

1. **Card** (Aggregate Root)
   - Has identity through CardId
   - Properties: type, content, metadata, creation date
   - May reference other cards (for highlights, notes, screenshots)

2. **Collection** (Aggregate Root)
   - Has identity through CollectionId
   - Properties: name, description, creation date
   - Contains references to member cards

3. **Library** (Aggregate Root)
   - Has identity through user's identity
   - Contains references to all user's cards
   - May contain references to collections

### Value Objects

1. **CardId**
   - Unique identifier for a card

2. **CardType**
   - Enumeration of possible card types (URL, Note, Highlight, Screenshot, File)

3. **CardContent**
   - Value object representing the content of a card (varies by type)

4. **CollectionId**
   - Unique identifier for a collection

5. **CuratorId**
   - References the user who owns/created the card or collection

## Domain Services

1. **LibraryService**
   - Coordinates operations that span multiple aggregates
   - Handles adding cards to libraries and collections

## Relationships and Boundaries

- **Card-Collection Relationship**: This is a many-to-many relationship. A card can be in multiple collections, and a collection can contain multiple cards.
  
- **Aggregate Boundaries**: 
  - The Card aggregate is responsible for its own data and direct relationships to other cards.
  - The Collection aggregate manages which cards are members of the collection.
  - When adding a card to a collection, the operation is handled by the Collection aggregate.

- **Card-to-Card Relationships**:
  - A card can reference other cards (e.g., a highlight card references its source URL card).
  - These relationships are maintained within the Card aggregate.

## Use Cases

1. **AddCardToLibrary**
   - Adds a new card to a user's library
   - May also add the card to one or more collections
   - May create related cards (notes, highlights, screenshots)

2. **AddCardToCollection**
   - Adds an existing card to a collection

3. **AnnotateCard**
   - Creates annotation cards (notes, highlights) linked to an existing card

## Implementation Considerations

- When a card is added to multiple collections, this should be handled as separate operations on each Collection aggregate.
- The LibraryService domain service coordinates operations that span multiple aggregates.
- Card-to-card relationships (like highlights of a URL) are maintained within the Card aggregate.
