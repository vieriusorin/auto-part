# TypeScript

Strict mode always on. Path alias: `@/*` → `src/*`.

## Rules

- **`type` over `interface`** — ESLint-enforced (`consistent-type-definitions: ['error', 'type']`)
- **No `any`** — use specific types; `unknown` + type guard when shape is uncertain
- **No enums** — use `const` maps or union types: `type Filter = 'day' | 'month' | 'year'`
- **`import type`** for type-only imports
- **Unused params/vars** — prefix with `_` to suppress ESLint (`_error`, `_ref`)
- **Optional chaining** always on query data and nullable values: `data?.items?.map()`
- **`Readonly<T>`** for API response types
- **`satisfies`** operator for type validation where helpful

## Path Alias

Always use `@/` for imports within `src/`:

```ts
// ✅
import { fetchClient } from '@/api/http-client/http-client';
import { useAuthStore } from '@/store/auth-store';

// ❌
import { fetchClient } from '../../../api/http-client/http-client';
```

## Type Definitions

```ts
// ✅ type, not interface
type UserProfile = {
  id: string;
  name: string;
  email?: string;
};

// ✅ Union types, not enums
type EnergyFilter = 'day' | 'month' | 'year';

// ✅ const map, not enum
const EnergyFilterValues = {
  Day: 'day',
  Month: 'month',
  Year: 'year',
} as const;
type EnergyFilter =
  (typeof EnergyFilterValues)[keyof typeof EnergyFilterValues];

// ✅ Readonly API response
type GetDeviceResponse = Readonly<{
  id: string;
  status: string;
}>;
```

## Import Order (ESLint-enforced)

Order: `expo` → `react` → `react-native` → other external → internal (`@/*`) → relative

```ts
import { useState } from 'react';
import { View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { fetchClient } from '@/api/http-client/http-client';

import { MySubComponent } from './MySubComponent';
```
