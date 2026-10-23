-- Create events table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  what text not null,
  "where" text not null,
  "when" timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create attendees table
create table public.attendees (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.events enable row level security;
alter table public.attendees enable row level security;

-- Policies for events
create policy "Allow public select on events" 
  on public.events for select 
  using ( true );

create policy "Allow public insert on events" 
  on public.events for insert 
  with check ( true );

-- Policies for attendees
create policy "Allow public select on attendees" 
  on public.attendees for select 
  using ( true );

create policy "Allow public insert on attendees" 
  on public.attendees for insert 
  with check ( true );
