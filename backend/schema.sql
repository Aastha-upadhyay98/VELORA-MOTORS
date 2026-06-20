-- ============================================
-- Velora Motors — Database Schema
-- ============================================
-- How to use this file:
-- 1. Go to https://supabase.com and create a free account + new project.
-- 2. In your project, open the "SQL Editor" tab on the left sidebar.
-- 3. Paste this entire file in and click "Run".
-- That's it — both tables will be created.

-- Table: stores every inquiry form submission from the Contact section
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  car_model text,
  part_needed text not null,
  created_at timestamptz not null default now()
);

-- Table: stores every newsletter signup email
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Table: stores "Add to Inquiry" cart-style picks (optional, but nice to have)
create table if not exists inquiry_items (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references inquiries(id) on delete cascade,
  part_name text not null,
  price text,
  created_at timestamptz not null default now()
);

-- Helpful index for viewing newest submissions first
create index if not exists idx_inquiries_created_at on inquiries (created_at desc);
create index if not exists idx_newsletter_created_at on newsletter_subscribers (created_at desc);
