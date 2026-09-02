create table if not exists public.keep_alive (
  id smallint primary key,
  last_ping timestamptz not null default now()
);

insert into public.keep_alive (id)
values (1)
on conflict (id) do nothing;

alter table public.keep_alive enable row level security;
