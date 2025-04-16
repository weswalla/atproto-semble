# Creating Annotations on a PDS

This guide demonstrates how to create an annotation record on a Personal Data Server (PDS) using the AT Protocol and the `annos.app` lexicons.

## Overview

Annotations in the `annos.app` system allow users to add structured metadata to content. This example shows how to create a star rating annotation.

## Prerequisites

- An AT Protocol account with a DID and handle
- Access to a PDS that supports the `annos.app` lexicons
- A client library for AT Protocol (we'll use JavaScript with the `@atproto/api` package)

## Example: Creating a Star Rating Annotation

### Installation

```bash
npm install @atproto/api
```

### Code Example

```javascript
import { BskyAgent } from '@atproto/api';

async function createStarRatingAnnotation() {
  // Initialize the agent
  const agent = new BskyAgent({
    service: 'https://your-pds.example.com',
  });
  
  // Log in to the PDS
  await agent.login({
    identifier: 'your-handle.bsky.social',
    password: 'your-password',
  });
  
  // Define the star rating annotation field
  const starRatingField = {
    id: 'movie-rating',
    definition: {
      name: 'Movie Rating',
      description: 'Rate a movie from 1 to 5 stars',
      numberOfStars: 5
    }
  };
  
  // Create the annotation record
  const annotation = {
    $type: 'app.annos.rating', // Note: Use the specific type for the $type field
    url: 'https://example.com/movie/interstellar', // The URL of the resource being annotated
    additionalIdentifiers: [ // Optional: Other ways to identify the resource
      { type: 'doi', value: '10.1234/example-doi' } 
    ],
    field: starRatingField,
    value: {
      rating: 4, // The actual rating value
      mustbeBetween: [0, 5]
    },
    createdAt: new Date().toISOString()
  };
  
  // Send the record to the PDS
  // Note: The collection MUST match the specific annotation type being created
  const response = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: 'app.annos.rating', // Use the specific collection NSID
    record: annotation
  });
  
  console.log('Annotation created:', response);
  return response;
}

createStarRatingAnnotation().catch(console.error);
```

## Request and Response Examples

### Request JSON

```json
{
  "repo": "did:plc:abcdefghijklmnopqrstuvwxyz",
  "collection": "app.annos.rating", // Collection matches the specific type
  "record": {
    "$type": "app.annos.rating", // $type also matches the specific type
    "url": "https://example.com/movie/interstellar",
    "additionalIdentifiers": [
      { "type": "doi", "value": "10.1234/example-doi" }
    ],
    "field": {
      "id": "movie-rating",
      "definition": {
        "name": "Movie Rating",
        "description": "Rate a movie from 1 to 5 stars",
        "numberOfStars": 5
      }
    },
    "value": {
      "rating": 4,
      "mustbeBetween": [0, 5]
    },
    "createdAt": "2025-04-16T15:30:45.123Z"
  }
}
```

### Response JSON

```json
{
  "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/annos.app.rating/3jkq5xbeti42s",
  "cid": "bafyreib3mgzrw5qy5c6xkwbp25w7wkhrm4npwfxitgzuhs5npjb2mfxd4q"
}
```

## Understanding Collections and Lexicon Types

You might notice that we created the record in the `app.annos.rating` collection, even though there's a more general `app.annos.annotation` lexicon. Here's why:

-   **Specific Collections:** Each distinct annotation *type* (like `dyad`, `triad`, `rating`, `select`) has its own lexicon (e.g., `app.annos.rating`) and corresponds to a specific collection NSID in the repository. When you create an annotation record using `com.atproto.repo.createRecord`, you **must** specify the collection that matches the *specific type* of annotation you are creating. The `$type` field within the record should also match this specific type.
-   **Generic Union Lexicon (`app.annos.annotation`):** This lexicon primarily serves two purposes:
    1.  **Defining Procedures/Queries:** It defines XRPC methods like `createAnnotation` and `getAnnotation`. The `input` and `output` schemas for these methods use a `union` referencing all the specific annotation types. This allows these generic endpoints to accept or return *any* valid annotation type.
    2.  **Defining a Generic Record Type (Conceptual):** The `main` record definition in `app.annos.annotation` is also a `union`. While you don't *create* records directly in the `app.annos.annotation` collection, this union definition signifies that any record whose type is one of the referenced specific types (e.g., `app.annos.rating#main`) can be considered conceptually as an "annotation". This is useful for generic querying or processing systems that might want to operate on all annotations regardless of their specific subtype.

**In summary:** Create records in the collection corresponding to their specific type (e.g., `app.annos.rating`). Use the generic `app.annos.annotation` lexicon when interacting with XRPC methods designed to handle multiple annotation types or when conceptually referring to any annotation.

## Using the Annotation

Once created, the annotation can be referenced by its URI. This URI can be used to:

1. Retrieve the annotation
2. Associate the annotation with other content
3. Update or delete the annotation (by the owner)

## Additional Annotation Types

The `app.annos.*` lexicons support several other annotation types, each stored in its own collection:

- `app.annos.dyad` - For representing relationships between two sides
- `app.annos.triad` - For representing relationships between three vertices
- `app.annos.select` - For single and multi-select options (both stored in the `app.annos.select` collection, distinguished by their internal `$type`)

Each type has its own specific structure as defined in its respective lexicon. Remember to use the correct collection NSID when creating records for these types.
