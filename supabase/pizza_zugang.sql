-- Zugang der Organisatoren ueber ein gemeinsames Passwort statt ueber Konten.
--
-- Der Passwort-Hash (bcrypt) liegt im Schema "intern", das PostgREST nicht
-- ausliefert. Die Anmeldeliste selbst hat keine Lese-Policy mehr; heran kommen
-- nur die SECURITY-DEFINER-Funktionen unten, und die geben erst nach
-- erfolgreicher Passwortpruefung etwas zurueck. Ein falsches Passwort endet
-- mit SQLSTATE 28P01, was PostgREST als 403 ausliefert.
--
-- Passwort spaeter aendern: nur hier im SQL-Editor, nicht von der Seite aus
--   select public.pizza_passwort_aendern('altes', 'neues');

create schema if not exists intern;
revoke all on schema intern from anon, authenticated, public;

create table if not exists intern.pizza_zugang (
  id            integer primary key default 1 check (id = 1),
  hash          text not null,
  geaendert_am  timestamptz not null default now()
);
alter table intern.pizza_zugang enable row level security;

-- Startpasswort; bitte nach dem ersten Anmelden aendern.
insert into intern.pizza_zugang (id, hash)
values (1, extensions.crypt('PizzaTawba26', extensions.gen_salt('bf', 10)))
on conflict (id) do nothing;

create or replace function intern.pizza_passwort_ok(p_passwort text)
returns boolean
language sql
security definer
set search_path = intern, extensions
stable
as $$
  select exists (
    select 1 from intern.pizza_zugang
    where id = 1 and hash = extensions.crypt(coalesce(p_passwort, ''), hash)
  );
$$;

drop policy if exists "lesen_nur_angemeldet"    on public.pizza_anmeldungen;
drop policy if exists "aendern_nur_angemeldet"  on public.pizza_anmeldungen;
drop policy if exists "loeschen_nur_angemeldet" on public.pizza_anmeldungen;

create or replace function public.pizza_liste(p_passwort text)
returns table (id uuid, name text, alter_jahre smallint, anwesend boolean, eingetragen_am timestamptz)
language plpgsql
security definer
set search_path = public, intern
stable
as $$
begin
  if not intern.pizza_passwort_ok(p_passwort) then
    raise exception 'falsches Passwort' using errcode = '28P01';
  end if;
  return query
    select a.id, a.name, a.alter_jahre, a.anwesend, a.eingetragen_am
    from public.pizza_anmeldungen a
    order by a.eingetragen_am asc;
end;
$$;

create or replace function public.pizza_anwesend(p_passwort text, p_id uuid, p_wert boolean)
returns void
language plpgsql
security definer
set search_path = public, intern
as $$
begin
  if not intern.pizza_passwort_ok(p_passwort) then
    raise exception 'falsches Passwort' using errcode = '28P01';
  end if;
  update public.pizza_anmeldungen set anwesend = p_wert where id = p_id;
end;
$$;

create or replace function public.pizza_loeschen(p_passwort text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, intern
as $$
begin
  if not intern.pizza_passwort_ok(p_passwort) then
    raise exception 'falsches Passwort' using errcode = '28P01';
  end if;
  delete from public.pizza_anmeldungen where id = p_id;
end;
$$;

create or replace function public.pizza_passwort_aendern(p_alt text, p_neu text)
returns void
language plpgsql
security definer
set search_path = intern, extensions
as $$
begin
  if not intern.pizza_passwort_ok(p_alt) then
    raise exception 'falsches Passwort' using errcode = '28P01';
  end if;
  if length(coalesce(p_neu, '')) < 8 then
    raise exception 'neues Passwort muss mindestens 8 Zeichen haben' using errcode = '22023';
  end if;
  update intern.pizza_zugang
     set hash = extensions.crypt(p_neu, extensions.gen_salt('bf', 10)),
         geaendert_am = now()
   where id = 1;
end;
$$;

-- Die Prueffunktion selbst bleibt unerreichbar, sonst waere sie ein
-- bequemes Werkzeug zum Passwortraten.
revoke all on function intern.pizza_passwort_ok(text) from public, anon, authenticated;

revoke all on function public.pizza_liste(text)                    from public;
revoke all on function public.pizza_anwesend(text, uuid, boolean)  from public;
revoke all on function public.pizza_loeschen(text, uuid)           from public;
revoke all on function public.pizza_passwort_aendern(text, text)   from public;

grant execute on function public.pizza_liste(text)                   to anon, authenticated;
grant execute on function public.pizza_anwesend(text, uuid, boolean) to anon, authenticated;
grant execute on function public.pizza_loeschen(text, uuid)          to anon, authenticated;

-- Der Passwortwechsel bleibt bewusst dem SQL-Editor vorbehalten und ist ueber
-- die API nicht erreichbar.
revoke execute on function public.pizza_passwort_aendern(text, text) from anon, authenticated;
