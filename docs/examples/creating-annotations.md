# Creating Annotations on a PDS

This guide demonstrates how to create an annotation record on a Personal Data Server (PDS) using the AT Protocol and the `app.annos.annotation` lexicons.

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
import { BskyAgent } from "@atproto/api";

async function createStarRatingAnnotation() {
  // Initialize the agent
  const agent = new BskyAgent({
    service: "https://your-pds.example.com",
  });

  // Log in to the PDS
  await agent.login({
    identifier: "your-handle.bsky.social",
    password: "your-password",
  });

  // Define the star rating annotation field
  const starRatingField = {
    id: "movie-rating",
    definition: {
      name: "Movie Rating",
      description: "Rate a movie from 1 to 5 stars",
      numberOfStars: 5,
    },
  };

  // Create the annotation record
  const annotation = {
    $type: "app.annos.rating", // Note: Use the specific type for the $type field
    url: "https://example.com/movie/interstellar", // The URL of the resource being annotated
    additionalIdentifiers: [
      // Optional: Other ways to identify the resource
      { type: "doi", value: "10.1234/example-doi" },
    ],
    field: starRatingField,
    value: {
      rating: 4, // The actual rating value
      mustbeBetween: [0, 5],
    },
    createdAt: new Date().toISOString(),
  };

  // Send the record to the PDS
  // Note: The collection MUST match the specific annotation type being created
  const response = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.rating", // Use the specific collection NSID
    record: annotation,
  });

  console.log("Annotation created:", response);
  return response;
}

createStarRatingAnnotation().catch(console.error);
```

## Example: Annotating a Podcast Episode using a Template

This example demonstrates creating a reusable template for podcast annotations and then applying it to a specific episode.

### 1. Define and Create the Template

First, we define the structure of our "Podcast Template" and create it as a record in the `app.annos.template` collection.

```javascript
import { BskyAgent, RichText } from "@atproto/api";

async function createPodcastTemplate(agent) {
  // Define the fields for the podcast template
  const audienceField = {
    id: "podcast-audience", // Unique ID for this field within the template context
    definition: {
      $type: "app.annos.dyad#dyadAnnotationField", // Lexicon type for the field definition
      name: "Audience Accessibility",
      description: "How accessible is the content to different audiences?",
      sideA: "Technical",
      sideB: "General",
    },
  };

  const qualityField = {
    id: "podcast-quality",
    definition: {
      $type: "app.annos.rating#starRatingAnnotationField",
      name: "Audio Quality",
      description: "Rate the audio production quality",
      numberOfStars: 5,
    },
  };

  const useField = {
    id: "podcast-use",
    definition: {
      $type: "app.annos.select#multiSelectAnnotationField",
      name: "Intended Use",
      description: "Why would someone listen?",
      options: [
        "learn something new",
        "be entertained",
        "relax or unwind",
        "stay informed",
        "laugh",
        "get inspired",
        "background listening",
      ],
    },
  };

  // Create the template record
  const templateRecord = {
    $type: "app.annos.template",
    name: "Podcast Template",
    description: "Standard annotations for podcast episodes",
    annotationFields: [
      // References to the fields defined above
      { id: audienceField.id, definition: audienceField.definition },
      { id: qualityField.id, definition: qualityField.definition },
      { id: useField.id, definition: useField.definition },
    ],
    createdAt: new Date().toISOString(),
  };

  console.log("Creating template...");
  const templateResponse = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.template",
    record: templateRecord,
  });

  console.log("Template created:", templateResponse);
  return { templateUri: templateResponse.uri, fields: { audienceField, qualityField, useField } };
}

// --- Main Execution ---
async function runPodcastAnnotationExample() {
  const agent = new BskyAgent({
    service: "https://your-pds.example.com",
  });
  await agent.login({
    identifier: "your-handle.bsky.social",
    password: "your-password",
  });

  // 1. Create the template
  const { templateUri, fields } = await createPodcastTemplate(agent);

  // 2. Define the target resource (podcast episode)
  const podcastUrl = "https://example.com/podcast/episode/123";
  const podcastDoi = "10.9876/podcast.ep123";

  // 3. Create annotations using the template
  await createPodcastAnnotations(agent, templateUri, fields, podcastUrl, podcastDoi);
}

runPodcastAnnotationExample().catch(console.error);

```

### 2. Create Annotations Referencing the Template

Now, use the `templateUri` and field IDs obtained from the template creation to create specific annotations for a podcast episode.

```javascript
async function createPodcastAnnotations(agent, templateUri, fields, podcastUrl, podcastDoi) {
  const now = new Date().toISOString();
  const commonAnnotationProps = {
    url: podcastUrl,
    additionalIdentifiers: [{ type: "doi", value: podcastDoi }],
    fromTemplate: { id: templateUri }, // Reference the template record URI
    createdAt: now,
  };

  // a) Create Dyad Annotation (Audience Accessibility)
  const audienceAnnotation = {
    $type: "app.annos.dyad",
    ...commonAnnotationProps,
    field: { id: fields.audienceField.id }, // Reference the field ID from the template
    value: {
      value: 0.7, // Example value (leaning towards 'General')
      minValue: 0,
      maxValue: 1,
    },
  };
  console.log("Creating audience annotation...");
  const audienceResponse = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.dyad",
    record: audienceAnnotation,
  });
  console.log("Audience annotation created:", audienceResponse);

  // b) Create Rating Annotation (Audio Quality)
  const qualityAnnotation = {
    $type: "app.annos.rating",
    ...commonAnnotationProps,
    field: { id: fields.qualityField.id }, // Reference the field ID
    value: {
      rating: 5,
      mustbeBetween: [0, fields.qualityField.definition.numberOfStars],
    },
  };
  console.log("Creating quality annotation...");
  const qualityResponse = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.rating",
    record: qualityAnnotation,
  });
  console.log("Quality annotation created:", qualityResponse);

  // c) Create Multi-Select Annotation (Intended Use)
  const useAnnotation = {
    $type: "app.annos.select", // Note: $type is specific, but collection is app.annos.select
    ...commonAnnotationProps,
    field: { id: fields.useField.id }, // Reference the field ID
    value: {
      option: ["learn something new", "be entertained"], // Selected options
      mustbeSomeOf: fields.useField.definition.options,
    },
  };
  console.log("Creating intended use annotation...");
  const useResponse = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.select", // Collection for both single/multi select
    record: useAnnotation,
  });
  console.log("Intended use annotation created:", useResponse);
}
```


## Request and Response Examples

*(Combined examples for the Podcast Template scenario)*

### Request JSONs

**1. Create Template Request:**
```json
{
  "repo": "did:plc:abcdefghijklmnopqrstuvwxyz",
  "collection": "app.annos.template",
  "record": {
    "$type": "app.annos.template",
    "name": "Podcast Template",
    "description": "Standard annotations for podcast episodes",
    "annotationFields": [
      {
        "id": "podcast-audience",
        "definition": {
          "$type": "app.annos.dyad#dyadAnnotationField",
          "name": "Audience Accessibility",
          "description": "How accessible is the content to different audiences?",
          "sideA": "Technical",
          "sideB": "General"
        }
      },
      {
        "id": "podcast-quality",
        "definition": {
          "$type": "app.annos.rating#starRatingAnnotationField",
          "name": "Audio Quality",
          "description": "Rate the audio production quality",
          "numberOfStars": 5
        }
      },
      {
        "id": "podcast-use",
        "definition": {
          "$type": "app.annos.select#multiSelectAnnotationField",
          "name": "Intended Use",
          "description": "Why would someone listen?",
          "options": [
            "learn something new", "be entertained", "relax or unwind",
            "stay informed", "laugh", "get inspired", "background listening"
          ]
        }
      }
    ],
    "createdAt": "2025-04-16T16:00:00.000Z"
  }
}
```

**2. Create Dyad Annotation Request (using Template):**
```json
{
  "repo": "did:plc:abcdefghijklmnopqrstuvwxyz",
  "collection": "app.annos.dyad",
  "record": {
    "$type": "app.annos.dyad",
    "url": "https://example.com/podcast/episode/123",
    "additionalIdentifiers": [{"type": "doi", "value": "10.9876/podcast.ep123"}],
    "fromTemplate": { "id": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.template/3kabcde..." },
    "field": { "id": "podcast-audience" },
    "value": { "value": 0.7, "minValue": 0, "maxValue": 1 },
    "createdAt": "2025-04-16T16:01:00.000Z"
  }
}
```

**3. Create Rating Annotation Request (using Template):**
```json
{
  "repo": "did:plc:abcdefghijklmnopqrstuvwxyz",
  "collection": "app.annos.rating",
  "record": {
    "$type": "app.annos.rating",
    "url": "https://example.com/podcast/episode/123",
    "additionalIdentifiers": [{"type": "doi", "value": "10.9876/podcast.ep123"}],
    "fromTemplate": { "id": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.template/3kabcde..." },
    "field": { "id": "podcast-quality" },
    "value": { "rating": 5, "mustbeBetween": [0, 5] },
    "createdAt": "2025-04-16T16:01:01.000Z"
  }
}
```

**4. Create Multi-Select Annotation Request (using Template):**
```json
{
  "repo": "did:plc:abcdefghijklmnopqrstuvwxyz",
  "collection": "app.annos.select",
  "record": {
    "$type": "app.annos.select", // Specific type within the record
    "url": "https://example.com/podcast/episode/123",
    "additionalIdentifiers": [{"type": "doi", "value": "10.9876/podcast.ep123"}],
    "fromTemplate": { "id": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.template/3kabcde..." },
    "field": { "id": "podcast-use" },
    "value": {
      "option": ["learn something new", "be entertained"],
      "mustbeSomeOf": [
         "learn something new", "be entertained", "relax or unwind",
         "stay informed", "laugh", "get inspired", "background listening"
      ]
    },
    "createdAt": "2025-04-16T16:01:02.000Z"
  }
}
```

### Response JSONs

*(Example responses for each creation)*

**1. Create Template Response:**
```json
{
  "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.template/3kabcdefg...",
  "cid": "bafyreia..."
}
```

**2. Create Dyad Annotation Response:**
```json
{
  "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.dyad/3khijklmn...",
  "cid": "bafyreib..."
}
```

**3. Create Rating Annotation Response:**
```json
{
  "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.rating/3kopqrstu...",
  "cid": "bafyreic..."
}
```

**4. Create Multi-Select Annotation Response:**
```json
{
  "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.select/3kvwxyzab...",
  "cid": "bafyreid..."
}
```

## Understanding Collections and Lexicon Types

You might notice that we created the record in the `app.annos.rating` collection, even though there's a more general `app.annos.annotation` lexicon. Here's why:

- **Specific Collections:** Each distinct annotation _type_ (like `dyad`, `triad`, `rating`, `select`) has its own lexicon (e.g., `app.annos.rating`) and corresponds to a specific collection NSID in the repository. When you create an annotation record using `com.atproto.repo.createRecord`, you **must** specify the collection that matches the _specific type_ of annotation you are creating. The `$type` field within the record should also match this specific type.
- **Generic Union Lexicon (`app.annos.annotation`):** This lexicon primarily serves two purposes:
  1.  **Defining Procedures/Queries:** It defines XRPC methods like `createAnnotation` and `getAnnotation`. The `input` and `output` schemas for these methods use a `union` referencing all the specific annotation types. This allows these generic endpoints to accept or return _any_ valid annotation type.
  2.  **Defining a Generic Record Type (Conceptual):** The `main` record definition in `app.annos.annotation` is also a `union`. While you don't _create_ records directly in the `app.annos.annotation` collection, this union definition signifies that any record whose type is one of the referenced specific types (e.g., `app.annos.rating#main`) can be considered conceptually as an "annotation". This is useful for generic querying or processing systems that might want to operate on all annotations regardless of their specific subtype.

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
