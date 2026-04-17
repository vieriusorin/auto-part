# Better Auth Reference

Detailed patterns and solutions for Better Auth with Next.js and Drizzle ORM.

---

## OAuth Provider Setup

### Adding Providers to auth.ts

```typescript
export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

### OAuth Sign-In Button

```typescript
"use client";

import { signIn } from "@/lib/auth/client";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn.social({ provider: "google", callbackURL: "/dashboard" })}
    >
      Sign in with Google
    </button>
  );
}
```

### Required Environment Variables (per provider)

```bash
# Google
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# GitHub
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

Redirect URI to register in each provider's console:
`http://localhost:3000/api/auth/callback/<provider>`

---

## RBAC

### Custom Fields in Schema

```typescript
// In schema
export const users = pgTable("users", {
  // ... core fields
  role: varchar("role", { enum: ["admin", "member"] }).notNull().default("member"),
});
```

### Custom Fields in auth.ts

```typescript
user: {
  additionalFields: {
    role: {
      type: "string",
      required: false,
      defaultValue: "member",
      input: false, // users cannot set their own role on signup
    },
  },
},
```

### Auto-Assign Roles with Database Hooks

```typescript
export const auth = betterAuth({
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const invitation = await db
            .select()
            .from(invitations)
            .where(eq(invitations.email, user.email))
            .limit(1);

          // First user becomes admin; invited users become members
          const role = invitation.length > 0 ? "member" : "admin";

          await db.update(users).set({ role }).where(eq(users.id, user.id));
        },
      },
    },
  },
});
```

### Middleware Authorization

**File**: `src/middleware.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth/better-auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (!session && isAdminRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isAdminRoute && session?.user.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
```

### Server Action Authorization

```typescript
"use server";

import { auth } from "@/lib/auth/better-auth";
import { headers } from "next/headers";

export async function deleteUser(userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "admin") throw new Error("Forbidden: Admin access required");

  await db.delete(users).where(eq(users.id, userId));
  return { success: true };
}
```

### Client-Side Role Guard

```typescript
"use client";

import { useSession } from "@/lib/auth/client";

export function AdminPanel() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session || session.user.role !== "admin") return <div>Access denied</div>;

  return <div>Admin content</div>;
}
```

---

## Seeding Users

```typescript
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/infrastructure/database/drizzle";
import { users, accounts } from "@/infrastructure/database/schema";

async function seedUsers() {
  // Must use same hashing as Better Auth config
  const hashedPassword = await bcrypt.hash("password123", 10);

  const testUsers = [
    { email: "admin@example.com", name: "Admin", role: "admin" },
    { email: "user@example.com", name: "User", role: "member" },
  ];

  for (const userData of testUsers) {
    const userId = crypto.randomUUID();

    // 1. Insert user — NO password field
    await db.insert(users).values({
      id: userId,
      name: userData.name,
      email: userData.email,
      emailVerified: true,
      role: userData.role,
    });

    // 2. Insert credential account — WITH password
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId,
      type: "email",
      provider: "credential", // critical for email/password auth
      providerAccountId: userData.email,
      password: hashedPassword,
    });
  }
}

seedUsers();
```

Key rules:
- User row has NO password field
- Account row has password field
- Provider is `"credential"` for email/password
- Use the same hashing algorithm as configured in `auth.ts`

---

## Sign-In Component

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
      if (error) { setError(error.message); return; }
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
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
    </form>
  );
}
```

---

## Protected Server Component

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/better-auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/sign-in");

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

---

## Common Errors and Solutions

### "Invalid password hash"

**Causes**:
1. Hashing algorithm mismatch between seed and auth.ts (bcrypt vs scrypt)
2. Password stored in wrong table
3. Stale data with incompatible format

**Fix**: Configure Better Auth to match the seeding algorithm, then re-seed.

```typescript
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
```

Then: `npm run seed:db`

### "Table/column not found"

**Fix**: Push schema to database.

```bash
npx drizzle-kit push
# or generate + migrate
npx drizzle-kit generate && npx drizzle-kit migrate
```

### Field mapping issues

**Fix**: Add `usePlural: true` to the adapter.

```typescript
database: drizzleAdapter(db, {
  provider: "pg",
  schema,
  usePlural: true, // maps: user → users, account → accounts, session → sessions
}),
```

---

## Production Checklist

### Security
- [ ] Strong `BETTER_AUTH_SECRET` (32+ chars, randomly generated)
- [ ] Secrets only in environment variables, never committed
- [ ] `useSecureCookies: true` in production
- [ ] `httpOnly: true` for session cookies
- [ ] `sameSite: "lax"` or `"strict"`
- [ ] Email verification enabled
- [ ] Password strength requirements enforced

### Database
- [ ] Foreign keys with `onDelete: "cascade"`
- [ ] Indexes on `email` and `userId` columns
- [ ] Database backups configured
- [ ] Migration history tracked

### Performance
- [ ] Session cookie caching enabled (`cookieCache`)
- [ ] Appropriate session expiration (7 days default)
- [ ] Database connection pooling

### Monitoring
- [ ] Log authentication failures
- [ ] Track failed login attempts
- [ ] Alert on unusual access patterns
