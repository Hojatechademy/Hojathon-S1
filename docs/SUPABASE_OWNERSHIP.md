# Supabase ownership and coordination

## One shared project

The entire hackathon uses one Supabase project. Both developers use the same database, Auth configuration, RLS policies, and environment configuration. Separate developer projects are not allowed.

## Module ownership

- **Developer 1 — Patient Workspace:** owns the Supabase reads and writes required for authentication, patient context, task/appointment/reminder display, and dashboard refresh.
- **Developer 2 — Follow-up Agent and Actions:** owns the Supabase reads and writes required for agent context retrieval, validated task status updates, and reminder creation.

Each developer must avoid changing unrelated module data logic and must not duplicate database access functions owned by the other module.

## Coordinated areas

Coordinate before modifying:

- schema and migrations
- RLS policies
- shared database contracts and status names
- authentication assumptions
- environment variable names
- shared Supabase client behavior

Keep the access pattern simple: UI → Next.js Server Action/Route Handler → Supabase. Privileged operations remain server-side. Never expose a service-role credential to client-side code or commit it to Git.
