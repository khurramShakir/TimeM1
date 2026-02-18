# Deployment Guide

This guide covers the steps to deploy the Time Budget application to production (e.g., Vercel, Netlify, Railway).

## 🚨 Critical: Database Provider Switch

**Validation:** Local development uses **SQLite**. Production uses **PostgreSQL**.
Prisma *does not* support changing the provider via environment variables dynamically at runtime. You must manually update `prisma/schema.prisma` before deploying.

### Pre-Deployment Checklist

1.  **Open** `prisma/schema.prisma`.
2.  **Find** the `datasource db` block.
3.  **Change** `provider` from `"sqlite"` to `"postgresql"`.

```prisma
// ❌ Local Development (Do not commit for prod)
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ✅ Production (Use this for deployment)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

4.  **Commit** this change: `git commit -m "chore: switch prisma provider to postgres for deploy"`
5.  **Push** to your repository.

## Environment Variables

Ensure your production environment has the following variables set:

-   `DATABASE_URL`: The connection string for your Postgres database (e.g., Supabase, Neon, Railway).
-   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk Auth Public Key.
-   `CLERK_SECRET_KEY`: Your Clerk Auth Secret Key.

## Post-Deployment

After deployment, your build pipeline should automatically run `prisma generate` and `prisma migrate deploy` (or `db push`) to update your production database schema.
