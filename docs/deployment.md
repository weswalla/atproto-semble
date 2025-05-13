# Deployment Guide

This guide covers how to deploy the Annotations API service both locally for development and to production using fly.io.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)
- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) (for fly.io deployment only)

## Local Deployment

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Create environment files:
   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local` with your configuration:
   ```
   NODE_ENV=local
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=annotations
   
   # Auth
   JWT_SECRET=your-local-secret-key
   ACCESS_TOKEN_EXPIRES_IN=3600
   REFRESH_TOKEN_EXPIRES_IN=2592000
   
   # ATProto
   ATPROTO_SERVICE_ENDPOINT=https://bsky.social
   ATPROTO_REDIRECT_URI=http://127.0.0.1:3000/api/users/oauth/callback
   
   # Server
   PORT=3000
   HOST=127.0.0.1
   ```

### Using Docker Compose

1. Create a `docker-compose.yml` file:
   ```yaml
   version: '3.8'
   
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=local
         - DB_HOST=db
         - DB_PORT=5432
         - DB_USERNAME=postgres
         - DB_PASSWORD=postgres
         - DB_NAME=annotations
       depends_on:
         - db
       volumes:
         - ./:/app
         - /app/node_modules
   
     db:
       image: postgres:14
       ports:
         - "5432:5432"
       environment:
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=postgres
         - POSTGRES_DB=annotations
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. Create a `Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   
   RUN npm install
   
   COPY . .
   
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "run", "start"]
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. Run migrations (if needed):
   ```bash
   docker-compose exec app npm run migrate
   ```

5. Access the API at http://localhost:3000

### Without Docker

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start a PostgreSQL database:
   ```bash
   docker run -d --name annotations-db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=annotations \
     -p 5432:5432 \
     postgres:14
   ```

3. Run migrations:
   ```bash
   npm run migrate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment with fly.io

### Setup

1. Install the flyctl CLI if you haven't already:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login to fly.io:
   ```bash
   fly auth login
   ```

3. Create a fly.io app:
   ```bash
   fly apps create annotations-api
   ```

4. Create a PostgreSQL database:
   ```bash
   fly postgres create --name annotations-db
   ```

5. Attach the database to your app:
   ```bash
   fly postgres attach --app annotations-api annotations-db
   ```

### Configuration

1. Create a `fly.toml` file:
   ```toml
   app = "annotations-api"
   primary_region = "iad"  # Choose your preferred region
   
   [build]
     dockerfile = "Dockerfile"
   
   [env]
     NODE_ENV = "prod"
     PORT = "8080"
     HOST = "0.0.0.0"
     ATPROTO_SERVICE_ENDPOINT = "https://bsky.social"
     ATPROTO_REDIRECT_URI = "https://your-app-url.fly.dev/api/users/oauth/callback"
   
   [http_service]
     internal_port = 8080
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 1
     processes = ["app"]
   ```

2. Set secrets:
   ```bash
   fly secrets set JWT_SECRET=your-production-secret-key \
     ACCESS_TOKEN_EXPIRES_IN=3600 \
     REFRESH_TOKEN_EXPIRES_IN=2592000
   ```

3. Update the `Dockerfile` for production:
   ```dockerfile
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   
   COPY package*.json ./
   
   RUN npm ci
   
   COPY . .
   
   RUN npm run build
   
   # Production image
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY --from=builder /app/package*.json ./
   COPY --from=builder /app/dist ./dist
   
   RUN npm ci --only=production
   
   EXPOSE 8080
   
   CMD ["node", "dist/index.js"]
   ```

### Deployment

1. Deploy the application:
   ```bash
   fly deploy
   ```

2. Open your application:
   ```bash
   fly open
   ```

### Scaling

To scale your application:

```bash
fly scale count 2  # Adjust the number as needed
```

### Monitoring

Monitor your application:

```bash
fly status
fly logs
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (local, dev, prod) | local |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USERNAME | Database username | postgres |
| DB_PASSWORD | Database password | postgres |
| DB_NAME | Database name | annotations |
| DATABASE_URL | Full database connection string | - |
| JWT_SECRET | Secret for JWT tokens | default-secret-change-in-production |
| ACCESS_TOKEN_EXPIRES_IN | Access token expiry in seconds | 3600 |
| REFRESH_TOKEN_EXPIRES_IN | Refresh token expiry in seconds | 2592000 |
| ATPROTO_SERVICE_ENDPOINT | AT Protocol service endpoint | https://bsky.social |
| ATPROTO_REDIRECT_URI | OAuth callback URL | http://127.0.0.1:3000/api/users/oauth/callback |
| PORT | Server port | 3000 |
| HOST | Server host | 127.0.0.1 |

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify the database is running:
   ```bash
   docker ps  # For local Docker deployment
   fly postgres list  # For fly.io deployment
   ```

2. Check connection parameters in environment variables.

3. For fly.io, ensure the database is properly attached:
   ```bash
   fly postgres attach --app annotations-api annotations-db
   ```

### Application Errors

1. Check application logs:
   ```bash
   docker-compose logs app  # For local Docker deployment
   fly logs  # For fly.io deployment
   ```

2. Verify all required environment variables are set.

3. For production issues, try redeploying:
   ```bash
   fly deploy
   ```
