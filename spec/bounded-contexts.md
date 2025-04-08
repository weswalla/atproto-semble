## 🌐 Bounded Contexts

The chosen bounded contexts aim to separate concerns clearly, improving modularity, maintainability, and scalability. Here's the reasoning behind each:

### 1. Annotation Management

- **Reasoning:** Manages the core action of annotating web content. Given annotations involve various metadata, it forms a foundational context.

### 2. Evaluation & Criteria Management

- **Reasoning:** Evaluations and criteria definitions represent a distinct logic related to structured assessments. Separating them ensures evaluations and criteria management remain independent and maintainable.

### 3. Tagging & Reactions

- **Reasoning:** Tags and reactions represent lightweight metadata, distinct from structured evaluation logic. Bundling tags and reactions allows efficient handling of quick, simple user interactions.

### 4. Collection Management (Curation)

- **Reasoning:** Collections represent user-driven grouping and prioritization. Keeping collections separate from individual annotations maintains clear separation between individual and aggregated data.

### 5. Annotation Template Management

- **Reasoning:** Templates are reusable structures used by annotations, involving defining and sharing schemas. Their lifecycle and management logic differ significantly from the annotations themselves.

### 6. Webpage Management

- **Reasoning:** Managing metadata about webpages is distinctly separate from user-generated annotations, involving external metadata extraction and management logic.
