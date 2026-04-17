---
name: better-auth-nextjs
description: Complete authentication and authorization with Better Auth, Next.js, and Drizzle ORM. Covers email/password, OAuth, RBAC, session management, and troubleshooting common authentication errors.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Better Auth with Next.js & Drizzle: Authentication & Authorization

> Project guardrail: this repository is React Native + Expo.  
> Do not use this skill unless the user explicitly asks for a separate Next.js/web backend task.

**Production-ready authentication patterns for Next.js applications using Better Auth and Drizzle ORM.**

---

## When to Use This Skill

Use this skill when:
- Setting up authentication in a Next.js project
- Implementing email/password or OAuth authentication
- Adding role-based access control (RBAC)
- Troubleshooting Better Auth errors ("Invalid password hash", field mapping issues)
- Configuring custom user fields or table names
- Implementing session management strategies

---

## Critical Concepts

### 🔑 #1: Passwords Belong in the `accounts` Table

**NEVER store passwords in the `users` table.**

```typescript
// ❌ WRONG - Password in users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }),
  password: text("password"), // ← DON'T DO THIS
});

// ✅ CORRECT - Password in accounts table
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  provider: varchar("provider", { length: 50 }), // "credential" for email/password
  password: text("password"), // ← Password belongs here
});
```

**Why?** Better Auth uses the accounts table to store ALL authentication methods:
- OAuth accounts: `provider: "google"`, stores access tokens
- Email/password: `provider: "credential"`, stores password hash

### 🔑 #2: Password Hashing Must Match

**Common Error**: "Invalid password hash"

**Cause**: Mismatch between hashing algorithm in seed file vs Better Auth config

```typescript
// If seed file uses bcrypt:
const hashedPassword = await bcrypt.hash("password123", 10);

// Better Auth config MUST also use bcrypt:
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => {
        const bcrypt = await import("bcryptjs");
        return bcrypt.hash(password, 10);
      },
      verify: async ({ password, hash }) => {
        const bcrypt = await import("bcryptjs");
        return bcrypt.compare(password, hash);
      },
    },
  },
});
```

### 🔑 #3: Table Name Mapping

Better Auth expects singular table names (`user`, `account`) but you likely use plural (`users`, `accounts`).

**Solution 1: Use `usePlural`**
```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true, // ← Automatically maps user → users
  }),
});
```

**Solution 2: Manual Mapping**
```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    schema: {
      ...schema,
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
    },
  }),
  user: { modelName: "users" },
  account: { modelName: "accounts" },
  session: { modelName: "sessions" },
});
```

---

## Complete Database Schema

### Required Tables

Better Auth requires 4 core tables:

```typescript
// 1. USERS - Profile information (NO PASSWORD)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),

  // Custom fields for your app
  role: varchar("role", { enum: ["admin", "member"] }).default("member"),
  subscriptionStatus: varchar("subscription_status", {
    enum: ["free", "premium", "trial"]
  }).default("free"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 2. ACCOUNTS - Authentication providers (WITH PASSWORD)
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  type: varchar("type", { enum: ["email", "oauth"] }).default("oauth"),
  provider: varchar("provider", { enum: ["google", "github", "credential"] }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),

  // ⚠️ CRITICAL: Password for credential provider
  password: text("password"),

  // OAuth tokens
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 3. SESSIONS - Active sessions
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 4. VERIFICATION - Email verification, password reset
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

---

## Better Auth Configuration

### Complete `auth.ts` Setup

**Location**: `src/lib/auth/better-auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/infrastructure/database/drizzle";
import { schema } from "@/infrastructure/database/schema";
import bcrypt from "bcryptjs";

export const auth = betterAuth({
  // Database connection
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verification: schema.verification,
    },
  }),

  // ✅ Account configuration (password field belongs here)
  account: {
    modelName: "accounts",
    fields: {
      accountId: "providerAccountId",
      providerId: "provider",
      password: "password", // ← Password field mapping
      accessToken: "accessToken",
      refreshToken: "refreshToken",
      scope: "scope",
      idToken: "idToken",
    },
  },

  // ✅ User configuration (NO password field)
  user: {
    modelName: "users",
    fields: {
      email: "email",
      name: "name",
      emailVerified: "emailVerified",
      image: "image",
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
        input: false, // ← Prevent users from setting role on signup
      },
      subscriptionStatus: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },
    },
  },

  // Session configuration
  session: {
    modelName: "sessions",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minute cache
      strategy: "jwe",
    },
  },

  // Email & Password
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,

    // ⚠️ CRITICAL: Configure password hashing
    password: {
      hash: async (password) => bcrypt.hash(password, 10),
      verify: async ({ password, hash }) => bcrypt.compare(password, hash),
    },

    // Password reset
    sendResetPassword: async ({ user, url }, request) => {
      // TODO: Implement email sending
      console.log(`Send reset email to ${user.email}: ${url}`);
    },
  },

  // Email verification
  emailVerification: {
    sendVerificationEmail: async ({ user, url }, request) => {
      // TODO: Implement email sending
      console.log(`Send verification to ${user.email}: ${url}`);
    },
  },

  // OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Security
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  plugins: [nextCookies()],

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
});
```

### Environment Variables

**File**: `.env.local`

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Better Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-super-secret-key-at-least-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## Authorization & RBAC

### Adding Custom User Fields

```typescript
// In schema
export const users = pgTable("users", {
  // ... core fields

  role: varchar("role", { enum: ["admin", "member"] })
    .notNull()
    .default("member"),
});

// In auth.ts
export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
        input: false, // ← Users can't set their own role
      },
    },
  },
});
```

### Auto-Assign Roles with Database Hooks

```typescript
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  // ... other config

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Check if user was invited
          const invitation = await db
            .select()
            .from(invitations)
            .where(eq(invitations.email, user.email))
            .limit(1);

          // First user is admin, invited users are members
          const role = invitation ? "member" : "admin";

          await db
            .update(users)
            .set({ role })
            .where(eq(users.id, user.id));
        },
      },
    },
  },
});
```

### Server-Side Authorization

**Middleware** (`src/middleware.ts`):

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth/better-auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  // Redirect unauthenticated users
  if (!session && isAdminRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Check admin role
  if (isAdminRoute && session?.user.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
```

**Server Actions**:

```typescript
"use server";

import { auth } from "@/lib/auth/better-auth";
import { headers } from "next/headers";

export async function deleteUser(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Authentication check
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Authorization check
  if (session.user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  await db.delete(users).where(eq(users.id, userId));
  return { success: true };
}
```

### Client-Side Authorization

```typescript
"use client";

import { useSession } from "@/lib/auth/client";

export function AdminPanel() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;

  if (!session || session.user.role !== "admin") {
    return <div>Access denied</div>;
  }

  return <div>Admin content</div>;
}
```

---

## Client Setup

### Create Auth Client

**File**: `src/lib/auth/client.ts`

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const { useSession, signIn, signOut, signUp } = authClient;
```

### Sign-In Component

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth/client";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await signIn.email({ email, password });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

### Protected Server Component

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/better-auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

---

## Seeding Users with Authentication

### Proper Seed File Structure

```typescript
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/infrastructure/database/drizzle";
import { users, accounts } from "@/infrastructure/database/schema";

async function seedUsers() {
  // Use same hashing as Better Auth config
  const hashedPassword = await bcrypt.hash("password123", 10);

  const testUsers = [
    { email: "admin@example.com", name: "Admin", role: "admin" },
    { email: "user@example.com", name: "User", role: "member" },
  ];

  for (const userData of testUsers) {
    const userId = crypto.randomUUID();

    // 1. Insert user (NO password field)
    await db.insert(users).values({
      id: userId,
      name: userData.name,
      email: userData.email,
      emailVerified: true,
      role: userData.role,
    });

    // 2. Insert credential account (WITH password)
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: userId,
      type: "email",
      provider: "credential", // ← Critical for email/password auth
      providerAccountId: userData.email,
      password: hashedPassword, // ← Password stored here
    });
  }
}

seedUsers();
```

**Key Points**:
- ✅ User has NO password field
- ✅ Account has password field
- ✅ Provider is "credential" for email/password
- ✅ Use same hashing algorithm as Better Auth config

---

## Common Errors & Solutions

### Error: "Invalid password hash"

**Symptoms**: Login fails with this error

**Causes**:
1. Password hashing mismatch (bcrypt vs scrypt)
2. Password in wrong table
3. Old data with incompatible format

**Solution**:

```typescript
// Configure Better Auth to use bcrypt (if seed uses bcrypt)
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => {
        const bcrypt = await import("bcryptjs");
        return bcrypt.hash(password, 10);
      },
      verify: async ({ password, hash }) => {
        const bcrypt = await import("bcryptjs");
        return bcrypt.compare(password, hash);
      },
    },
  },
});

// Then re-seed database
npm run seed:db
```

### Error: Table/Column Not Found

**Symptoms**: "table users not found" or "column password does not exist"

**Cause**: Database schema out of sync with code

**Solution**:

```bash
# Push schema changes to database
npx drizzle-kit push

# Or generate and run migration
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Error: Field Mapping Issues

**Symptoms**: Better Auth can't find tables/fields

**Cause**: Plural table names or custom field names not mapped

**Solution**:

```typescript
// Use usePlural for plural table names
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true, // ← user → users, account → accounts
  }),
});
```

---

## Production Checklist

### Security
- [ ] Strong BETTER_AUTH_SECRET (32+ chars, random)
- [ ] Secrets in environment variables (not committed)
- [ ] `useSecureCookies: true` in production
- [ ] `httpOnly: true` for session cookies
- [ ] `sameSite: "lax"` or `"strict"`
- [ ] Email verification enabled
- [ ] Password strength requirements enforced

### Database
- [ ] Foreign keys with `onDelete: "cascade"`
- [ ] Indexes on email, userId columns
- [ ] Database backups configured
- [ ] Migration history tracked

### Performance
- [ ] Session cookie caching enabled
- [ ] Appropriate session expiration times
- [ ] Database connection pooling

### Monitoring
- [ ] Log authentication failures
- [ ] Track failed login attempts
- [ ] Alert on unusual patterns

---

## Quick Reference

### Core Tables
1. `users` - Profile (NO password)
2. `accounts` - Auth providers (WITH password)
3. `sessions` - Active sessions
4. `verification` - Tokens

### Configuration Keys
- `user.fields` - Map field names
- `account.fields` - Password belongs here
- `user.additionalFields` - Custom fields
- `emailAndPassword.password` - Hashing config

### Common Patterns
- Password in `accounts`, provider "credential"
- Custom fields use `additionalFields`
- Role assignment in `databaseHooks`
- Authorization in middleware + server actions

### Debugging
1. Check password hashing algorithm match
2. Verify table/field name mapping
3. Confirm password in accounts table
4. Test with fresh seed data

---

**Last Updated**: 2026-02-20
**Skill Type**: Authentication & Authorization
**Stack**: Next.js 16, Better Auth, Drizzle ORM, PostgreSQL
