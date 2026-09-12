# Ente Ward — Setup & Execution Guide

Welcome to **Ente Ward (എന്റെ വാർഡ്)**, an autonomous civic action platform powered by Google Gemini and Supabase.

This guide provides step-by-step instructions to set up, configure, and execute the project locally.

---

## 1. Prerequisites

Before setting up the project, ensure you have:

* **Node.js**: Version `18.0.0` or higher (tested on Node.js `20.x` and `24.x`).
* **npm**: Version `9.x` or higher (comes bundled with Node.js).
* **Git**: To clone and navigate the repository.
* **Modern Web Browser**: Chrome, Edge, Safari, or Firefox.

---

## 2. Dependencies & Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/mshibin04/Hojathon-S1.git
cd Hojathon-S1
npm install
```

---

## 3. Environment Configuration

Create a local environment file `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Populate the required environment variables:

```env
# Supabase Backend Configuration
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API Configuration (Model: gemini-3.6-flash)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Obtaining Free API Keys
1. **Google Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/) to generate a free API key.
2. **Supabase**: Create a free project at [Supabase.com](https://supabase.com). Copy the Project URL and Anon Public Key from **Project Settings ➜ API**.

---

## 4. Running the Development Server

Start the local Vite development server:

```bash
npm run dev
```

The application will be available at:
```
http://localhost:5173
```

---

## 5. Production Build & Verification

To test the production compilation and bundle:

```bash
# Type check with TypeScript
npx tsc -b

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 6. Judge & Evaluator Login Credentials

For convenience during hackathon judging, the following roles and credentials are pre-configured:

| Portal | Username | Password | Role & Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` *(or `base admin`)* | `admin@123` | Platform Admin (Districts, Panchayats, Representative Provisioning) |
| **Representative** | `rep007` | *(Any password / Demo quick-fill)* | Ward 7 Representative Action Hub |
| **Resident** | `resident001` | *(Any password / Demo quick-fill)* | Ward 7 Resident Portal & Ward Sahayakan AI Agent |

---

## 7. Database Migrations (Optional)

If you are connecting your own Supabase instance, execute the following SQL scripts in your Supabase SQL Editor in this order:

1. [`docs/supabase_location_master_data.sql`](docs/supabase_location_master_data.sql) — Kerala Districts, Panchayats, and Wards.
2. [`docs/supabase_contacts_and_residents.sql`](docs/supabase_contacts_and_residents.sql) — Ward emergency contacts & Kerala government directory.
3. [`docs/supabase_agent_tables.sql`](docs/supabase_agent_tables.sql) — Agent run traces and tool execution tables.
4. [`docs/supabase_username_auth.sql`](docs/supabase_username_auth.sql) — Username resolution mappings.
