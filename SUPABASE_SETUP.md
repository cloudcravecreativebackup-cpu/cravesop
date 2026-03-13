# Supabase Setup Guide

To connect your application to Supabase, follow these steps:

## 1. Create a Supabase Project
Go to [Supabase](https://supabase.com/) and create a new project.

## 2. Run the SQL Schema
Copy and paste the following SQL into your Supabase **SQL Editor** and run it to create the necessary tables:

```sql
-- Organizations Table
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  tenant_id TEXT NOT NULL,
  config JSONB NOT NULL
);

-- Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  registration_status TEXT NOT NULL,
  mentor_id TEXT,
  avatar TEXT,
  weekly_capacity_hours INTEGER,
  password TEXT
);

-- Services Table
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  templates JSONB NOT NULL
);

-- Brands Table
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  services JSONB NOT NULL,
  lead_id TEXT
);

-- Tasks Table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id),
  brand_id TEXT REFERENCES brands(id),
  service_type TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  status TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  progress_update TEXT,
  estimated_hours NUMERIC NOT NULL,
  hours_spent NUMERIC NOT NULL,
  comments JSONB NOT NULL,
  time_entries JSONB,
  reporting_period TEXT NOT NULL,
  related_calendar_id TEXT,
  related_calendar_entry_id TEXT
);

-- Content Calendars Table
CREATE TABLE content_calendars (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id),
  brand_id TEXT REFERENCES brands(id),
  name TEXT NOT NULL,
  entries JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  lead_id TEXT
);

-- Notifications Table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL,
  related_task_id TEXT,
  related_user_id TEXT
);
```

## 3. Configure Environment Variables
Add the following variables to your Vercel project or local `.env` file:

- `VITE_SUPABASE_URL`: Your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key

## 4. How it works
The app uses a **Hybrid Persistence Layer**:
1. **Local Storage**: Data is saved locally for immediate responsiveness.
2. **Supabase**: If credentials are provided, the app automatically syncs data to your Supabase database in the background.
3. **Initial Load**: On startup, the app fetches the latest state from Supabase.
