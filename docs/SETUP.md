# Setup Guide

This project uses Next.js, React, TypeScript, shadcn/ui, Supabase, and Gemini. The application implementation will be built in this fork; this document defines the judge-ready setup contract.

## Prerequisites

- Git
- Node.js 20 or later and npm
- Internet access
- A valid Gemini API key
- Access to the shared Supabase project

## Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Shared Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable/anon key |
| `GEMINI_API_KEY` | Server-side Gemini key; required for the AI Agent |
| `GEMINI_MODEL` | Optional Gemini model override; defaults to `gemini-2.0-flash` |

Copy `.env.example` to `.env.local`, then fill in real local values. Never commit `.env.local`, API keys, passwords, tokens, or service-role credentials.

## Installation

```bash
git clone https://github.com/mohammadkaifktraihsoft-ai/Hojathon-S1.git
cd Hojathon-S1
npm install
copy .env.example .env.local
```

On macOS/Linux, use `cp .env.example .env.local` instead of `copy`.

## Shared Supabase project

Both developers use one shared Supabase project for the database, authentication, RLS policies, and project configuration. Do not create separate developer projects. Apply migrations to that shared project only.

Developer 1 owns Supabase operations required by the Patient Workspace. Developer 2 owns Supabase operations required by the Follow-up Agent and Actions module. Schema, migrations, RLS, shared contracts, and authentication assumptions require coordination before changes.

Gemini is accessed only by the server-side Next.js agent layer. Privileged operations must use server-side functions/actions. Never expose a service-role credential to client code.

## Running

```bash
npm run dev
```

The judge should sign in, inspect the follow-up workspace, ask the agent about a missed appointment, and verify an approved task/reminder action persists.

## Testing

```bash
npm run typecheck
npm run build
```
