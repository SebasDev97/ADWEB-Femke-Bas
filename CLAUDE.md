# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # run ESLint
npm test         # run all Jest tests
npx jest __tests__/services/categoryService.test.ts  # run a single test file
```

Firebase env vars are needed to run the app locally — copy `.env.local.example` to `.env.local` and fill in the `NEXT_PUBLIC_FIREBASE_*` values.

## Architecture

This is a **Next.js 16 App Router** household budget app backed by **Firebase** (Auth + Firestore). All pages are client components (`'use client'`).

### Data layer

- `config/firebase.js` — exports `auth`, `provider`, `db` (Firestore instance)
- `services/categoryService.ts` and `services/transactionService.ts` — pure functions that accept `db: Firestore` as their first argument; they never import `db` directly, which keeps them testable
- `hooks/useCategories.ts`, `hooks/useTransactions.ts` — subscribe to Firestore real-time snapshots for a given `bookId`; return `{ data, loading, error }`
- `hooks/useCategoryBudget.ts` — pure computation over categories + transactions; derives `spentCents`, `remainingCents`, `usageRatio`, `isWarning` (≥80%), `isExceeded` (>100%)

### Auth

`context/AuthContext.tsx` provides `useAuth()` → `{ user, loading }`. Pages redirect to `/login` when `!loading && !user`.

### Firestore schema

Collections: `householdbooks`, `categories`, `transactions`, `users`

- `householdbooks`: `{ name, description, ownerId, members: string[], archived, createdAt }`
- `categories`: `{ bookId, name, maxBudget (cents), endDate, createdBy, createdAt }`
- `transactions`: `{ bookId, categoryId (nullable), type: 'income'|'expense', amountCents, description, date, createdBy, createdAt }`
- `users`: `{ email }` — used only for invite-by-email lookup

Security rules in `firestore.rules` enforce that only book owners/members can read or write their book's categories and transactions.

### Money

All monetary values are stored and computed in **cents** (integers). `utils/money.ts` provides `centsToCurrencyString` (formats with `Intl.NumberFormat`, defaults to nl-NL / EUR) and `euroStringToCents`.

### Routing

```
/                          → root (redirects to /householdbooks)
/login, /sign-up
/householdbooks            → list active books
/householdbooks/new        → create book
/householdbooks/archived   → archived books
/householdbooks/[id]       → book detail / categories view
/householdbooks/[id]/edit
/householdbooks/[id]/transactions           → transactions list with MonthSelector
/householdbooks/[id]/transactions/new
/householdbooks/[id]/transactions/[txId]/edit
/householdbooks/[id]/categories/new
/householdbooks/[id]/categories/[catId]/edit
```

### Testing

Tests live in `__tests__/` and mirror the `services/` and `hooks/` directories. Service tests mock all `firebase/firestore` SDK functions and use `testDb` from `__tests__/helpers/testFirestore.ts` (a named Firebase app keyed to `'demo-test'`). Component tests use `@testing-library/react`.
