# Semble

```
                                      /\
                                     /  \
                                    /    \
                                   /      \
                                  /        \
                                 /          \
                                /            \
                               /              \
                              /                \
                             /                  \
                            /                    \
                           /        /\  /\        \
                          /        /  \/  \        \
                         /        /        \        \
                        /________/          \________\
                       /\                            /\
                      /  \                          /  \
                     /    \                        /    \
                    /      \                      /      \
                   /        \                    /        \
                  /          \                  /          \
                 /            \                /            \
                /              \              /              \
               /                \            /                \
              /                  \          /                  \
             /                    \        /                    \
            /                      \      /                      \
           /                        \    /                        \
          /                          \  /                          \
         /                            \/                            \
        /________________________________________________________________\
```

An AT Protocol annotation service built with TypeScript.

## Overview

Semble (formerly "annos") is an annotation service that enables rich interactions and collaborative features on the AT Protocol network.

## Getting Started

### Prerequisites

- Node.js
- Docker (for local database and Redis)
- PostgreSQL
- Redis

### Installation

```bash
npm install
```

### Development

Start the local database and Redis:

```bash
npm run db:start
npm run redis:start
```

Run the application in development mode:

```bash
npm run dev
```

Run with mock repositories and auth:

```bash
npm run dev:mock
```

### Testing

Run unit tests:

```bash
npm run test:unit
```

Run database integration tests:

```bash
npm run test:integration:db
```

Run all tests:

```bash
npm run test
```

## Database Migrations

When making changes to SQL schema files (`.sql.ts`):

```bash
npm run db:generate
```

This generates migration files that Drizzle runs during app initialization.

## Deployment

Deployed on Fly.io:

```bash
fly deploy
```

View logs:

```bash
fly logs --app annos
```

Set secrets:

```bash
fly secrets set SUPER_SECRET_KEY=value
```

## Documentation

See [DEVELOPERS.md](./DEVELOPERS.md) for additional developer documentation.

## License

ISC
