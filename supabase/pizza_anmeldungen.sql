-- Anmeldeliste fuer das Pizzabacken.
-- Eintragen darf jeder mit dem Link (Rolle anon). Gelesen, abgehakt und
-- geloescht wird ausschliesslich ueber die Funktionen in pizza_zugang.sql,
-- die das Passwort des Orga-Teams pruefen. Deshalb gibt es hier nur eine
-- einzige Policy, naemlich fuers Eintragen.

create table if not exists public.pizza_anmeldungen (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  alter_jahre    smallint not null,
  anwesend       boolean not null default false,
  eingetragen_am timestamptz not null default now(),
  constraint pizza_name_laenge  check (char_length(btrim(name)) between 2 and 60),
  constraint pizza_alter_bereich check (alter_jahre between 1 and 120)
);

-- kein Name doppelt; Gross-/Kleinschreibung und beliebige Leerzeichen
-- ergeben keinen neuen Namen
drop index if exists public.pizza_anmeldungen_name_einmalig;
create unique index pizza_anmeldungen_name_einmalig
  on public.pizza_anmeldungen (lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));

alter table public.pizza_anmeldungen enable row level security;

drop policy if exists "eintragen_fuer_alle" on public.pizza_anmeldungen;
create policy "eintragen_fuer_alle" on public.pizza_anmeldungen
  for insert to anon, authenticated with check (true);

-- nur die Anzahl, keine Namen: damit Teilnehmer nach dem Eintragen eine
-- Rueckmeldung bekommen, ohne die Liste zu sehen
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
