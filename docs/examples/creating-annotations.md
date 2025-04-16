# Creating Annotations using Templates

This guide demonstrates how to create annotation field records, group them into a template, and then use that template to create annotations on a Personal Data Server (PDS) using the AT Protocol and the `app.annos.*` lexicons.

## Prerequisites

- An AT Protocol account with a DID and handle
- Access to a PDS that supports the `app.annos.*` lexicons
- A client library for AT Protocol (we'll use JavaScript with the `@atproto/api` package)

## Installation

```bash
npm install @atproto/api
```

## Example: Annotating a Podcast Episode using a Template

This example involves three main steps:

1.  Creating individual `app.annos.annotationField` records for each type of annotation (dyad, rating, multi-select).
2.  Creating an `app.annos.annotationTemplate` record that groups strong references to the field records created in step 1.
3.  Creating `app.annos.annotation` records for a specific podcast episode, referencing the template and the appropriate field record, and providing the specific annotation value.

### 1. Create Annotation Field Records

First, we define and create the individual field records. Each field record defines the structure and constraints for a specific type of annotation.

```javascript
import { BskyAgent } from "@atproto/api";

// Helper function to create a field record
async function createFieldRecord(agent, name, description, definition) {
  const record = {
    $type: "app.annos.annotationField",
    name: name,
    description: description,
    definition: definition,
    createdAt: new Date().toISOString(),
  };

  console.log(`Creating field record: ${name}...`);
  const response = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.annotationField",
    record: record,
  });
  console.log(`Field record '${name}' created:`, response.uri);
  // Return a strong ref object
  return { uri: response.uri, cid: response.cid };
}

// --- Main Execution ---
async function runPodcastAnnotationExample() {
  const agent = new BskyAgent({
    service: "https://your-pds.example.com", // Replace with your PDS URL
  });
  await agent.login({
    identifier: "your-handle.bsky.social", // Replace with your handle
    password: "your-password", // Replace with your app password
  });

  // --- Define and Create Fields ---

  // a) Dyad Field (Audience Accessibility)
  const audienceFieldRef = await createFieldRecord(
    agent,
    "Audience Accessibility",
    "How accessible is the content to different audiences?",
    {
      $type: "app.annos.annotationField#dyadFieldDef",
      sideA: "Technical",
      sideB: "General",
    }
  );

  // b) Rating Field (Audio Quality)
  const qualityFieldRef = await createFieldRecord(
    agent,
    "Audio Quality",
    "Rate the audio production quality (1-5 stars)",
    {
      $type: "app.annos.annotationField#ratingFieldDef",
      numberOfStars: 5, // Lexicon defines this must be 5
    }
  );

  // c) Multi-Select Field (Intended Use)
  const useOptions = [
    "learn something new",
    "be entertained",
    "relax or unwind",
    "stay informed",
    "laugh",
    "get inspired",
    "background listening",
  ];
  const useFieldRef = await createFieldRecord(
    agent,
    "Intended Use",
    "Why would someone listen?",
    {
      $type: "app.annos.annotationField#multiSelectFieldDef",
      options: useOptions,
    }
  );

  // Store refs for later use
  const fieldRefs = {
    audience: audienceFieldRef,
    quality: qualityFieldRef,
    use: useFieldRef,
  };

  // 2. Create the Template Record
  const templateRef = await createPodcastTemplate(agent, fieldRefs);

  // 3. Define the target resource (podcast episode)
  const podcastUrl = "https://example.com/podcast/episode/123";
  const podcastDoi = "10.9876/podcast.ep123";

  // 4. Create annotations using the template and field refs
  await createPodcastAnnotations(
    agent,
    templateRef,
    fieldRefs,
    podcastUrl,
    podcastDoi
  );
}

runPodcastAnnotationExample().catch(console.error);
```

### 2. Create the Template Record

Now, create the `app.annos.annotationTemplate` record, including strong references (`ref`) to the field records created above. We can also mark fields as required within the template context.

```javascript
async function createPodcastTemplate(agent, fieldRefs) {
  // Create the template record, referencing the field records
  const templateRecord = {
    $type: "app.annos.annotationTemplate",
    name: "Podcast Template",
    description: "Standard annotations for podcast episodes",
    annotationFields: [
      // Array of annotationFieldRef objects
      { ref: fieldRefs.audience, required: true }, // Mark audience as required
      { ref: fieldRefs.quality, required: true }, // Mark quality as required
      { ref: fieldRefs.use, required: false }, // Mark use as optional
    ],
    createdAt: new Date().toISOString(),
  };

  console.log("Creating template record...");
  const templateResponse = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.annotationTemplate", // Use the correct collection
    record: templateRecord,
  });

  console.log("Template record created:", templateResponse.uri);
  // Return a strong ref to the template
  return { uri: templateResponse.uri, cid: templateResponse.cid };
}
```

### 3. Create Annotations Referencing the Template and Fields

Finally, create the actual `app.annos.annotation` records for the podcast episode. Each annotation record references both the template and the specific field record it corresponds to, and includes the annotation value conforming to the structure defined in `lexicons/annotation.json`.

```javascript
async function createPodcastAnnotations(
  agent,
  templateRef,
  fieldRefs,
  podcastUrl,
  podcastDoi
) {
  const now = new Date().toISOString();

  // Common properties for all annotations created from this template for this URL
  const baseAnnotation = {
    $type: "app.annos.annotation", // All annotations use this $type
    url: podcastUrl,
    additionalIdentifiers: [{ type: "doi", value: podcastDoi }],
    fromTemplate: templateRef, // Strong ref to the template record
    createdAt: now,
  };

  // a) Create Dyad Annotation (Audience Accessibility)
  // Value should be integer 0-100 as per lexicon
  const audienceAnnotation = {
    ...baseAnnotation,
    field: fieldRefs.audience, // Strong ref to the Audience field record
    value: {
      // Structure matches #dyadValue in annotation.json
      value: 70, // Example value (0=Technical, 100=General)
    },
    note: "Leans towards a general audience but has some technical jargon.", // Optional note
  };
  console.log("Creating audience annotation...");
  const audienceResponse = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.annotation", // ALL annotations go in this collection
    record: audienceAnnotation,
  });
  console.log("Audience annotation created:", audienceResponse.uri);

  // b) Create Rating Annotation (Audio Quality)
  // Value should be integer 1-5 as per lexicon (via field def)
  const qualityAnnotation = {
    ...baseAnnotation,
    field: fieldRefs.quality, // Strong ref to the Quality field record
    value: {
      // Structure matches #ratingValue in annotation.json
      rating: 5,
      // 'mustbeBetween' is not part of the value record itself, it's a constraint defined by the field
    },
  };
  console.log("Creating quality annotation...");
  const qualityResponse = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.annotation",
    record: qualityAnnotation,
  });
  console.log("Quality annotation created:", qualityResponse.uri);

  // c) Create Multi-Select Annotation (Intended Use)
  const useAnnotation = {
    ...baseAnnotation,
    field: fieldRefs.use, // Strong ref to the Use field record
    value: {
      // Structure matches #multiSelectValue in annotation.json
      option: ["learn something new", "be entertained"], // Selected options
      // 'mustbeSomeOf' is not part of the value record, it's a constraint defined by the field
    },
  };
  console.log("Creating intended use annotation...");
  const useResponse = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: "app.annos.annotation",
    record: useAnnotation,
  });
  console.log("Intended use annotation created:", useResponse.uri);
}
```

## Request and Response Examples (Conceptual)

Below are conceptual JSON structures for the requests and responses involved in the podcast template scenario. Replace placeholders like DIDs, CIDs, and timestamps with actual values.

### Request JSONs

**1. Create Field Record Request (Example: Dyad Field)**

```json
{
  "repo": "did:plc:abcdefghijklmnopqrstuvwxyz",
  "collection": "app.annos.annotationField",
  "record": {
    "$type": "app.annos.annotationField",
    "name": "Audience Accessibility",
    "description": "How accessible is the content to different audiences?",
    "definition": {
      "sideA": "Technical",
      "sideB": "General"
    },
    "createdAt": "2025-04-16T17:00:00.000Z"
  }
}
```

_(Similar requests are made for the Rating and Multi-Select fields)_

**2. Create Template Record Request:**

```json
{
  "repo": "did:plc:abcdefghijklmnopqrstuvwxyz",
  "collection": "app.annos.annotationTemplate",
  "record": {
    "$type": "app.annos.annotationTemplate",
    "name": "Podcast Template",
    "description": "Standard annotations for podcast episodes",
    "annotationFields": [
      {
        "ref": {
          "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.annotationField/3kfieldDyad...",
          "cid": "bafyreia..."
        },
        "required": true
      },
      {
        "ref": {
          "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.annotationField/3kfieldRating...",
          "cid": "bafyreib..."
        },
        "required": true
      },
      {
        "ref": {
          "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.annotationField/3kfieldSelect...",
          "cid": "bafyreic..."
        },
        "required": false
      }
    ],
    "createdAt": "2025-04-16T17:01:00.000Z"
  }
}
```

**3. Create Annotation Record Request (Example: Dyad Annotation)**

```json
{
  "repo": "did:plc:abcdefghijklmnopqrstuvwxyz",
  "collection": "app.annos.annotation", // Note: Collection is always app.annos.annotation
  "record": {
    "$type": "app.annos.annotation", // Note: $type is always app.annos.annotation
    "url": "https://example.com/podcast/episode/123",
    "additionalIdentifiers": [
      { "type": "doi", "value": "10.9876/podcast.ep123" }
    ],
    "fromTemplate": {
      "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.annotationTemplate/3ktemplate...",
      "cid": "bafyreid..."
    },
    "field": {
      // Strong ref to the specific FIELD record
      "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.annotationField/3kfieldDyad...",
      "cid": "bafyreia..."
    },
    "value": {
      // Value structure matches #dyadValue in annotation.json
      "value": 70
    },
    "note": "Leans towards a general audience but has some technical jargon.",
    "createdAt": "2025-04-16T17:02:00.000Z"
  }
}
```

_(Similar requests are made for the Rating and Multi-Select annotations, changing the `field` ref and `value` structure accordingly)_

### Response JSONs (Conceptual)

**1. Create Field Record Response (Example: Dyad Field)**

```json
{
  "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.annotationField/3kfieldDyad...",
  "cid": "bafyreia..."
}
```

**2. Create Template Record Response:**

```json
{
  "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.annotationTemplate/3ktemplate...",
  "cid": "bafyreid..."
}
```

**3. Create Annotation Record Response (Example: Dyad Annotation)**

```json
{
  "uri": "at://did:plc:abcdefghijklmnopqrstuvwxyz/app.annos.annotation/3kannoDyad...",
  "cid": "bafyreie..."
}
```

## Understanding Collections and Record Types

With the `app.annos.*` lexicons version 1:

- **`app.annos.annotationField`**: Defines the _structure_ of an annotation type (e.g., a 5-star rating, a dyad with specific labels). Records are created in the `app.annos.annotationField` collection.
- **`app.annos.annotationTemplate`**: Groups strong references to `app.annos.annotationField` records to create a reusable template. Records are created in the `app.annos.annotationTemplate` collection.
- **`app.annos.annotation`**: Represents an _actual annotation_ on a resource.
  - All annotation records, regardless of their specific type (rating, dyad, etc.), are created in the **`app.annos.annotation` collection**.
  - The `$type` of these records is always **`app.annos.annotation`**.
  - The specific type of the annotation is determined by:
    1.  The `field` property, which is a strong reference to an `app.annos.annotationField` record. The definition within that field record dictates the expected structure and constraints.
    2.  The `value` property within the annotation record, which must conform to one of the union types defined in `lexicons/annotation.json` (e.g., `dyadValue`, `ratingValue`). The structure of the `value` object corresponds to the type defined by the referenced `field`.

**In summary:** Define fields (`app.annos.annotationField`), optionally group them in templates (`app.annos.annotationTemplate`), and create actual annotations (`app.annos.annotation`) in the single `app.annos.annotation` collection, referencing the appropriate field and providing the corresponding value structure.

## Using the Records

Once created, the URIs for field, template, and annotation records can be used to:

1.  Retrieve the records.
2.  Reference them in other records (e.g., linking annotations to posts, using templates).
3.  Update or delete the records (by the owner).
