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

## External services and database

Gemini is accessed only by the server-side Next.js agent layer. Supabase provides Auth, PostgreSQL, and RLS. Apply the project migrations created during implementation setup to the shared Supabase project. Do not create a second project.

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
