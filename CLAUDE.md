# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Admin portal for a karting league management system. Built on TailAdmin (Next.js dashboard template) with Supabase as the backend. The UI is in Spanish.

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npm start` — Start production server

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Supabase (auth + database) via `@supabase/ssr` for SSR-compatible session handling
- SVGs imported as React components via `@svgr/webpack`
- Icons: `lucide-react`

## Architecture

### Route Groups

- `src/app/(admin)/` — Protected admin pages with sidebar/header layout. Uses client-side auth guard in layout.
- `src/app/(full-width-pages)/` — Public pages (signin, error pages) with no chrome.

### Authentication Flow

- **Middleware** (`middleware.ts`): Uses `@supabase/ssr` server client to refresh sessions and redirect unauthenticated users to `/signin`.
- **AuthContext** (`src/context/AuthContext.tsx`): Client-side provider that checks if the logged-in user has an `admin` role in the `pilot` table. Non-admins are signed out.
- **Supabase clients**: Browser client in `src/lib/supabase.ts`, middleware server client in `src/lib/supabase-server.ts`.

### Context Providers (Root Layout)

`AuthProvider` > `ThemeProvider` > `SidebarProvider` — all wrap the app in `src/app/layout.tsx`.

### Database Types

All Supabase table types are defined in `src/lib/supabase.ts`: Circuit, LapTime, League, Pilot, PilotTeamSeason, Race, RaceResult, Season, Session, Team, PilotStanding, TeamStanding.

### Entity Pages Pattern

Each entity (pilotos, equipos, carreras, circuitos, temporadas, sesiones, tiempos, resultados, pilotos-temporadas) follows the same structure under `src/app/(admin)/(others-pages)/<entity>/`:
- `page.tsx` — List view with client-side pagination
- `[id]/editar/page.tsx` — Edit form
- `crear/page.tsx` — Create form (some entities)

Pages are `'use client'` components that query Supabase directly via the browser client.

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
