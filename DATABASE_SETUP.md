# PostgreSQL Setup Guide

## Quick Start with Neon (Free)

### 1. Create a Neon Account

- Go to https://neon.tech
- Sign up (GitHub / Google / Email)
- Create a new project

### 2. Get Connection String

- Click on "Connect"
- Copy the connection string (looks like):
  ```
  postgresql://user:password@host.neon.tech:5432/neondb?sslmode=require
  ```

### 3. Add to `.env`

```bash
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/neondb?sslmode=require
```

### 4. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations to PostgreSQL
npx prisma migrate deploy

# Or create a new migration (first time)
npx prisma db push
```

### 5. Start Dev Server

```bash
npm run dev
```

## Alternative: Docker PostgreSQL (Local)

If you prefer local PostgreSQL:

```bash
# Install Docker Desktop first

# Run PostgreSQL in Docker
docker run --name postgres-hop -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres:latest

# Set DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hop

# Create database
docker exec postgres-hop psql -U postgres -c "CREATE DATABASE hop;"

# Apply migrations
npx prisma db push
```

## Migration from SQLite to PostgreSQL

If you're migrating existing data:

```bash
# 1. Export from SQLite
sqlite3 dev.sqlite ".dump" > dump.sql

# 2. Switch to PostgreSQL (update .env with DATABASE_URL)

# 3. Apply schema
npx prisma db push

# 4. Import data (if needed)
# Note: You may need to manually migrate data due to schema differences
```

## Verify Connection

```bash
# Open Prisma Studio
npx prisma studio

# Or test connection via node
node -e "const prisma = require('./app/db.server').default; console.log('Connected!');"
```

## Production Deployment

For production, use environment variables on your hosting platform:

- Railway: Add `DATABASE_URL` in environment variables
- Vercel: Add to `Environment Variables`
- Heroku: Set `DATABASE_URL` config var
- Google Cloud Run: Set as secret or environment variable

Example for `.env.production`:

```bash
DATABASE_URL=postgresql://prod_user:prod_pass@prod-host:5432/hop_prod
NODE_ENV=production
```
