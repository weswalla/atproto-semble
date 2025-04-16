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
    $type: 'annos.app.rating',
    field: starRatingField,
    value: {
      rating: 4,
      mustbeBetween: [0, 5]
    },
    createdAt: new Date().toISOString()
  };
  
  // Send the record to the PDS
  const response = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: 'annos.app.rating',
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
  "collection": "annos.app.rating",
  "record": {
    "$type": "annos.app.rating",
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

## Using the Annotation

Once created, the annotation can be referenced by its URI. This URI can be used to:

1. Retrieve the annotation
2. Associate the annotation with other content
3. Update or delete the annotation (by the owner)

## Additional Annotation Types

The `annos.app` lexicons support several other annotation types:

- `annos.app.dyad` - For representing relationships between two sides
- `annos.app.triad` - For representing relationships between three vertices
- `annos.app.select` - For single and multi-select options

Each type has its own specific structure as defined in the lexicons.
