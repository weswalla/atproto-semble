## 📂 Codebase Directory Structure

A clear and intuitive directory layout to reflect the above bounded contexts and layers:

```
structured-annotation-app/
├── src/
│   ├── annotation/
│   │   ├── domain/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── events/
│   ├── evaluation/
│   │   ├── domain/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── events/
│   ├── tagging/
│   │   ├── domain/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── events/
│   ├── collection/
│   │   ├── domain/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── events/
│   ├── template/
│   │   ├── domain/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── events/
│   ├── webpage/
│   │   ├── domain/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── events/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── messaging/
│   │   └── integrations/
│   └── presentation/
│       ├── browser-extension/
│       └── web-dashboard/
├── tests/
├── docs/
└── config/
```

---

# 📁 Codebase Directory Structure (Monorepo Style)

```bash
structured-annotation-app/
├── apps/                         # Entrypoints and delivery mechanisms
│   ├── web-dashboard/            # Frontend app
│   ├── browser-extension/        # Browser extension UI
│   └── api-server/               # HTTP APIs (controllers, REST/GraphQL handlers)
│       └── main.ts               # Server bootstrap file
│
├── packages/
│   ├── core/                     # Shared core logic (not domain-specific)
│   │   ├── types/                # Shared types/interfaces (e.g. Result, Either, etc.)
│   │   ├── utils/                # Generic helpers (validation, formatting)
│   │   └── errors/               # Global error helpers
│   │       └── DomainError.ts
│
│   ├── annotation/               # Bounded Context: Structured Annotations
│   │   ├── domain/
│   │   │   ├── entities/         # Annotation entity
│   │   │   │   └── StructuredAnnotation.ts
│   │   │   ├── value-objects/    # Notes, highlights, etc.
│   │   │   ├── services/         # Pure domain logic (e.g., constraints)
│   │   │   └── events/           # Domain events
│   │   │       └── AnnotationCreated.ts
│   │   ├── application/
│   │   │   ├── use-cases/        # App service layer for commands/queries
│   │   │   │   └── CreateAnnotation.ts
│   │   │   ├── dtos/             # Data Transfer Objects
│   │   │   └── errors/           # Expressive application-specific errors
│   │   │       └── InvalidAnnotationError.ts
│   │   ├── infrastructure/
│   │   │   ├── repositories/     # Database implementations
│   │   │   │   └── PrismaAnnotationRepository.ts
│   │   │   └── persistence/      # DB models, mappers
│   │   │       └── annotation.mapper.ts
│   │   └── tests/
│   │       ├── unit/             # Pure domain logic unit tests
│   │       └── integration/      # Persistence + use-case level tests
│
│   ├── evaluation/               # Bounded Context: Evaluation + Criteria
│   │   ├── domain/
│   │   │   ├── entities/         # Criterion
│   │   │   ├── value-objects/    # Ratings, dyads, triads
│   │   │   ├── events/
│   │   │   └── services/         # Validation logic (e.g. triad sums = 1.0)
│   │   ├── application/
│   │   │   ├── use-cases/        # DefineCriterion, RateContent
│   │   │   └── errors/           # e.g. InvalidTriadError
│   │   ├── infrastructure/
│   │   │   └── repositories/
│   │   └── tests/
│
│   ├── template/                 # Bounded Context: Annotation Templates
│   │   ├── domain/
│   │   │   ├── entities/         # AnnotationTemplate
│   │   │   └── events/
│   │   ├── application/
│   │   │   └── use-cases/        # CreateTemplate, ShareTemplate
│   │   └── infrastructure/
│   │   └── tests/
│
│   ├── collection/              # Bounded Context: Collections (Curation)
│   ├── tagging/                 # Tags & reactions (quick metadata)
│   ├── webpage/                 # Webpage metadata (title, favicon, etc.)
│
│   └── shared-kernel/           # Cross-domain abstractions
│       ├── domain/
│       │   └── Entity.ts
│       ├── value-objects/
│       │   └── URL.ts
│       ├── base/
│       │   └── AggregateRoot.ts
│       └── infrastructure/
│           └── Result.ts        # Success/failure pattern
│
├── tests/                       # Global test config, e2e, test data
│   ├── e2e/
│   ├── mocks/
│   └── setup/
│
├── scripts/                     # CLI tools, DB migrations, lint, build
│   └── migrate.ts
├── prisma/                      # DB schema + seed files
├── .env
├── tsconfig.json
└── package.json
```
