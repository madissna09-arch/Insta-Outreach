-- Anmeldeliste fuer das Pizzabacken.
-- Eintragen darf jeder mit dem Link (anon), lesen/aendern/loeschen nur angemeldete
-- Organisatoren. Die Teilnehmerzahl kommt ueber die Funktion pizza_anzahl(),
-- damit Teilnehmer eine Rueckmeldung bekommen, ohne die Namen zu sehen.

create table if not exists public.pizza_anmeldungen (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  alter_jahre    smallint not null,
  anwesend       boolean not null default false,
  eingetragen_am timestamptz not null default now(),
  constraint pizza_name_laenge  check (char_length(btrim(name)) between 2 and 60),
  constraint pizza_alter_bereich check (alter_jahre between 1 and 120)
);

-- kein Name doppelt, Gross-/Kleinschreibung und Leerzeichen egal
create unique index if not exists pizza_anmeldungen_name_einmalig
  on public.pizza_anmeldungen (lower(btrim(name)));

alter table public.pizza_anmeldungen enable row level security;

drop policy if exists "eintragen_fuer_alle" on public.pizza_anmeldungen;
create policy "eintragen_fuer_alle" on public.pizza_anmeldungen
  for insert to anon, authenticated with check (true);

drop policy if exists "lesen_nur_angemeldet" on public.pizza_anmeldungen;
create policy "lesen_nur_angemeldet" on public.pizza_anmeldungen
  for select to authenticated using (true);

drop policy if exists "aendern_nur_angemeldet" on public.pizza_anmeldungen;
create policy "aendern_nur_angemeldet" on public.pizza_anmeldungen
  for update to authenticated using (true) with check (true);

drop policy if exists "loeschen_nur_angemeldet" on public.pizza_anmeldungen;
create policy "loeschen_nur_angemeldet" on public.pizza_anmeldungen
  for delete to authenticated using (true);

-- nur die Anzahl, keine Namen
create or replace function public.pizza_anzahl()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int from public.pizza_anmeldungen;
$$;

revoke all on function public.pizza_anzahl() from public;
grant execute on function public.pizza_anzahl() to anon, authenticated;
