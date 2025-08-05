# Fly.io Deployment Guide

This guide covers deploying your application with worker processes to Fly.io using Redis for distributed event processing.

## Current Setup Status ✅

Your application is already configured for multi-process deployment:

- **fly.toml**: Configured with `web` and `feed-worker` processes
- **package.json**: Has the `worker:feeds` script
- **tsup.config.ts**: Builds both web and worker entry points
- **Dockerfile**: Builds all artifacts needed for both processes

## Prerequisites

### 1. Redis Setup

Create and attach a Redis database to your app:

```bash
# Create Redis database
fly redis create --name annos-redis

# Attach it to your app (automatically sets REDIS_URL environment variable)
fly redis attach annos-redis

# Verify Redis status
fly redis status annos-redis
```

### 2. Verify Dependencies

Ensure worker dependencies are in production dependencies (not devDependencies):

```json
{
  "dependencies": {
    "bullmq": "^5.56.8",
    "ioredis": "^5.6.1"
  }
}
```

## Deployment Process

### 1. Deploy the Application

```bash
# Deploy both web and worker processes
fly deploy

# This creates:
# - At least one Machine for the 'web' process
# - At least one Machine for the 'feed-worker' process
```

### 2. Verify Deployment

```bash
# Check that both processes are running
fly status

# Should show something like:
# Machines
# PROCESS  ID            VERSION  REGION  STATE   ROLE  CHECKS  LAST UPDATED
# web      e2865641be97  v1       sea     started       ✓       2m ago
# feed-worker 1781973f03  v1       sea     started       ✓       2m ago
```

### 3. Monitor Worker Startup

```bash
# Check worker logs for successful startup
fly logs --process feed-worker

# Look for these success messages:
# "Connected to Redis successfully"
# "Feed worker started and listening for events..."
```

## Scaling Workers

### Horizontal Scaling (More Machines)

```bash
# Scale worker processes independently
fly scale count feed-worker=2

# Scale by region
fly scale count feed-worker=2 --region sea,ord

# Scale both web and workers
fly scale count web=3 feed-worker=2
```

### Vertical Scaling (More Resources)

```bash
# Scale worker memory
fly scale memory 1gb --process-group feed-worker

# Scale worker CPU/RAM preset
fly scale vm performance-2x --process-group feed-worker
```

## Troubleshooting

### 1. Worker Not Starting

```bash
# Check worker logs for errors
fly logs --process feed-worker

# Common issues:
# - Missing REDIS_URL environment variable
# - Redis connection failed
# - Missing dependencies
```

### 2. Redis Connection Issues

```bash
# Test Redis connection from worker
fly ssh console --process feed-worker
node -e "console.log('Redis URL:', process.env.REDIS_URL)"
node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(console.log)"
```

### 3. Worker Not Processing Jobs

```bash
# Check if jobs are being queued
fly redis connect annos-redis
> KEYS bull:*
> LLEN bull:feeds:waiting

# Monitor worker processing
fly logs --process feed-worker --follow
```

## Environment Variables

Both web and worker processes share the same environment variables automatically. Key variables:

- `REDIS_URL` - Set automatically by `fly redis attach`
- `DATABASE_URL` - Your database connection
- `NODE_ENV` - Set to "dev" in your fly.toml

## Process Communication

- **Web Process**: Publishes events to Redis queues
- **Worker Process**: Consumes events from Redis queues
- **Redis**: Acts as the message broker between processes

## Monitoring

### View Process Status

```bash
# List all machines by process
fly ps

# Get detailed app status
fly status
```

### Monitor Logs

```bash
# Web process logs
fly logs --process web

# Worker process logs
fly logs --process feed-worker

# All processes
fly logs
```

### Resource Usage

```bash
# Check resource metrics
fly metrics --process feed-worker
fly metrics --process web
```

## Development vs Production

### Local Development

For local development with Redis tunnel:

```bash
# Create tunnel to Redis
fly redis connect annos-redis

# Use tunnel address in your local environment
# Example: redis://localhost:10000
```

### Production

In production, processes automatically use the `REDIS_URL` environment variable set by Fly.io.

## Key Points

1. **No Dockerfile Changes Needed** - Your current Dockerfile works for both processes
2. **Shared Environment** - All processes share the same environment variables
3. **Independent Scaling** - Scale web and worker processes separately
4. **Automatic Deployment** - `fly deploy` handles both process types
5. **Redis Integration** - Use Fly's native Redis integration for best performance

## Quick Reference Commands

```bash
# Deploy
fly deploy

# Check status
fly status
fly ps

# Scale workers
fly scale count feed-worker=2

# Monitor
fly logs --process feed-worker --follow

# Debug
fly ssh console --process feed-worker
fly redis connect annos-redis
```
