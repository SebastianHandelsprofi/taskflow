-- ============================================================
-- TaskFlow SaaS – Multi-Tenant Schema mit Rollen & RLS
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. TENANTS (Firmen / Organisationen)
-- ─────────────────────────────────────────
create table public.tenants (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text not null unique,
  logo_url     text,
  plan         text not null default 'free'
                 check (plan in ('free', 'pro', 'enterprise')),
  max_users    int  not null default 10,
  active       bool not null default true,
  created_at   timestamptz default now()
);

-- ─────────────────────────────────────────
-- 2. PROFILES
-- ─────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  full_name    text not null,
  avatar_url   text,
  role         text not null default 'mitarbeiter'
                 check (role in ('admin', 'bereichsleiter', 'mitarbeiter')),
  team         text,
  level        int  not null default 1,
  xp           int  not null default 0,
  xp_next      int  not null default 500,
  points       int  not null default 0,
  active       bool not null default true,
  created_at   timestamptz default now()
);

create index profiles_tenant_idx on public.profiles(tenant_id);
create index profiles_role_idx   on public.profiles(tenant_id, role);

-- ─────────────────────────────────────────
-- 3. HILFSFUNKTIONEN
-- ─────────────────────────────────────────
create or replace function public.my_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_team()
returns text language sql stable security definer as $$
  select team from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns bool language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

create or replace function public.is_bereichsleiter_or_admin()
returns bool language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'bereichsleiter')
  )
$$;

-- ─────────────────────────────────────────
-- 4. AUTO-PROFIL beim Signup
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_tenant_id uuid;
  v_role      text;
begin
  v_tenant_id := (new.raw_user_meta_data->>'tenant_id')::uuid;
  v_role      := coalesce(new.raw_user_meta_data->>'role', 'mitarbeiter');

  if v_tenant_id is not null then
    insert into public.profiles (id, tenant_id, full_name, role)
    values (
      new.id,
      v_tenant_id,
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      v_role
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- 5. EINLADUNGEN
-- ─────────────────────────────────────────
create table public.invitations (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  email       text not null,
  role        text not null default 'mitarbeiter'
                check (role in ('admin', 'bereichsleiter', 'mitarbeiter')),
  team        text,
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid references public.profiles(id) on delete set null,
  accepted    bool not null default false,
  expires_at  timestamptz not null default now() + interval '7 days',
  created_at  timestamptz default now()
);

create index invitations_tenant_idx on public.invitations(tenant_id);
create index invitations_token_idx  on public.invitations(token);

-- ─────────────────────────────────────────
-- 6. TEAMS
-- ─────────────────────────────────────────
create table public.teams (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  color       text not null default '#6c63ff',
  created_at  timestamptz default now(),
  unique (tenant_id, name)
);

create index teams_tenant_idx on public.teams(tenant_id);

-- ─────────────────────────────────────────
-- 7. AUFGABEN
-- ─────────────────────────────────────────
create table public.tasks (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  title         text not null,
  description   text,
  category      text not null,
  priority      text not null default 'Mittel'
                  check (priority in ('Hoch', 'Mittel', 'Niedrig')),
  status        text not null default 'Offen'
                  check (status in ('Offen', 'In Bearbeitung', 'Erledigt', 'Ueberfaellig')),
  assignee_id   uuid references public.profiles(id) on delete set null,
  created_by    uuid references public.profiles(id) on delete set null,
  team          text,
  deadline      date,
  completed_at  timestamptz,
  points_value  int not null default 80,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index tasks_tenant_idx   on public.tasks(tenant_id);
create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_status_idx   on public.tasks(tenant_id, status);
create index tasks_team_idx     on public.tasks(tenant_id, team);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────
-- 8. BADGES
-- ─────────────────────────────────────────
create table public.badges (
  id          uuid primary key default uuid_generate_v4(),
  icon        text not null,
  name        text not null,
  description text not null,
  condition   text not null
);

insert into public.badges (icon, name, description, condition) values
  ('🏆', 'Top Performer',  '10 Aufgaben ohne Verzoegerung',    'ontime_10'),
  ('⚡', 'Blitzschnell',   'Aufgabe 2x schneller als geplant', 'fast_2x'),
  ('🎯', 'Praezise',       '30 Aufgaben puenktlich erledigt',  'ontime_30'),
  ('🔥', 'On Fire',        '5 Tage-Serie ohne Ueberfaelligkeit','streak_5'),
  ('🌟', 'Star der Woche', 'Hoechste Punktzahl im Team',       'top_week'),
  ('🔧', 'Problemloeser',  '3 kritische Aufgaben geloest',     'critical_3');

create table public.user_badges (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  badge_id    uuid references public.badges(id)   on delete cascade,
  earned_at   timestamptz default now(),
  unique (tenant_id, user_id, badge_id)
);

-- ─────────────────────────────────────────
-- 9. PUNKTE-LOG
-- ─────────────────────────────────────────
create table public.points_log (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  task_id     uuid references public.tasks(id)    on delete set null,
  points      int  not null,
  reason      text not null,
  created_at  timestamptz default now()
);

create index points_log_tenant_idx on public.points_log(tenant_id);
create index points_log_user_idx   on public.points_log(user_id);

-- ─────────────────────────────────────────
-- 10. CHALLENGES
-- ─────────────────────────────────────────
create table public.challenges (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  title        text not null,
  description  text,
  goal         int  not null,
  current      int  not null default 0,
  reward_xp    int  not null default 500,
  reward_badge uuid references public.badges(id),
  starts_at    date not null,
  ends_at      date not null,
  created_at   timestamptz default now()
);

create index challenges_tenant_idx on public.challenges(tenant_id);

-- ─────────────────────────────────────────
-- 11. GAMIFICATION TRIGGER
-- ─────────────────────────────────────────
create or replace function public.handle_task_completed()
returns trigger language plpgsql security definer as $$
declare
  pts          int;
  xp_gain      int;
  new_xp       int;
  new_level    int;
  new_xp_next  int;
  is_ontime    bool;
begin
  if new.status = 'Erledigt' and old.status <> 'Erledigt' then
    is_ontime := (new.deadline is null or current_date <= new.deadline);
    pts := new.points_value;
    if is_ontime             then pts := pts + 20; end if;
    if new.priority = 'Hoch' then pts := pts + 30; end if;
    new.completed_at := now();

    if new.assignee_id is not null then
      xp_gain := pts / 2;
      update public.profiles
        set points = points + pts, xp = xp + xp_gain
        where id = new.assignee_id
        returning xp, level, xp_next into new_xp, new_level, new_xp_next;

      while new_xp >= new_xp_next loop
        new_level   := new_level + 1;
        new_xp      := new_xp - new_xp_next;
        new_xp_next := round(new_xp_next * 1.5);
      end loop;

      update public.profiles
        set level = new_level, xp = new_xp, xp_next = new_xp_next
        where id = new.assignee_id;

      insert into public.points_log (tenant_id, user_id, task_id, points, reason)
        values (new.tenant_id, new.assignee_id, new.id, pts,
                case when is_ontime then 'Puenktlich erledigt' else 'Aufgabe erledigt' end);

      update public.challenges
        set current = current + 1
        where tenant_id = new.tenant_id
          and starts_at <= current_date
          and ends_at   >= current_date;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_task_completed
  before update on public.tasks
  for each row execute procedure public.handle_task_completed();

-- ─────────────────────────────────────────
-- 12. ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.tenants      enable row level security;
alter table public.profiles     enable row level security;
alter table public.invitations  enable row level security;
alter table public.teams        enable row level security;
alter table public.tasks        enable row level security;
alter table public.badges       enable row level security;
alter table public.user_badges  enable row level security;
alter table public.points_log   enable row level security;
alter table public.challenges   enable row level security;

-- TENANTS
create policy "Tenants: eigenen sehen"
  on public.tenants for select
  using (id = public.my_tenant_id());

create policy "Tenants: Admin updaten"
  on public.tenants for update
  using (id = public.my_tenant_id() and public.is_admin());

-- PROFILES
create policy "Profiles: eigener Tenant lesen"
  on public.profiles for select
  using (tenant_id = public.my_tenant_id());

create policy "Profiles: Admin anlegen"
  on public.profiles for insert
  with check (tenant_id = public.my_tenant_id() and public.is_admin());

create policy "Profiles: updaten nach Rolle"
  on public.profiles for update
  using (
    tenant_id = public.my_tenant_id() and (
      public.is_admin()
      or (public.my_role() = 'bereichsleiter' and team = public.my_team())
      or id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or role = (select role from public.profiles where id = auth.uid())
  );

create policy "Profiles: Admin loeschen"
  on public.profiles for delete
  using (tenant_id = public.my_tenant_id() and public.is_admin());

-- INVITATIONS
create policy "Invitations: lesen"
  on public.invitations for select
  using (tenant_id = public.my_tenant_id() and public.is_bereichsleiter_or_admin());

create policy "Invitations: Admin erstellen"
  on public.invitations for insert
  with check (tenant_id = public.my_tenant_id() and public.is_admin());

create policy "Invitations: Admin loeschen"
  on public.invitations for delete
  using (tenant_id = public.my_tenant_id() and public.is_admin());

-- TEAMS
create policy "Teams: eigener Tenant lesen"
  on public.teams for select
  using (tenant_id = public.my_tenant_id());

create policy "Teams: Admin anlegen"
  on public.teams for insert
  with check (tenant_id = public.my_tenant_id() and public.is_admin());

create policy "Teams: Admin updaten"
  on public.teams for update
  using (tenant_id = public.my_tenant_id() and public.is_admin());

create policy "Teams: Admin loeschen"
  on public.teams for delete
  using (tenant_id = public.my_tenant_id() and public.is_admin());

-- TASKS
create policy "Tasks: eigener Tenant lesen"
  on public.tasks for select
  using (tenant_id = public.my_tenant_id());

create policy "Tasks: erstellen (Admin + Bereichsleiter)"
  on public.tasks for insert
  with check (tenant_id = public.my_tenant_id() and public.is_bereichsleiter_or_admin());

create policy "Tasks: updaten nach Rolle"
  on public.tasks for update
  using (
    tenant_id = public.my_tenant_id() and (
      public.is_admin()
      or (public.my_role() = 'bereichsleiter' and team = public.my_team())
      or assignee_id = auth.uid()
    )
  );

create policy "Tasks: Admin loeschen"
  on public.tasks for delete
  using (tenant_id = public.my_tenant_id() and public.is_admin());

-- BADGES (global, kein Tenant)
create policy "Badges: alle lesen"
  on public.badges for select using (true);

-- USER BADGES
create policy "UserBadges: eigener Tenant lesen"
  on public.user_badges for select
  using (tenant_id = public.my_tenant_id());

create policy "UserBadges: vergeben"
  on public.user_badges for insert
  with check (tenant_id = public.my_tenant_id());

-- POINTS LOG
create policy "PointsLog: lesen nach Rolle"
  on public.points_log for select
  using (
    tenant_id = public.my_tenant_id() and (
      public.is_bereichsleiter_or_admin()
      or user_id = auth.uid()
    )
  );

-- CHALLENGES
create policy "Challenges: eigener Tenant lesen"
  on public.challenges for select
  using (tenant_id = public.my_tenant_id());

create policy "Challenges: Admin verwalten insert"
  on public.challenges for insert
  with check (tenant_id = public.my_tenant_id() and public.is_admin());

create policy "Challenges: Admin verwalten update"
  on public.challenges for update
  using (tenant_id = public.my_tenant_id() and public.is_admin());

create policy "Challenges: Admin verwalten delete"
  on public.challenges for delete
  using (tenant_id = public.my_tenant_id() and public.is_admin());

-- ─────────────────────────────────────────
-- 13. VIEWS
-- ─────────────────────────────────────────
create or replace view public.leaderboard as
  select
    p.id, p.tenant_id, p.full_name, p.level, p.xp, p.xp_next,
    p.points, p.team, p.role,
    count(t.id) filter (where t.status = 'Erledigt')     as completed_tasks,
    count(t.id) filter (where t.status = 'Ueberfaellig') as overdue_tasks
  from public.profiles p
  left join public.tasks t on t.assignee_id = p.id
  where p.active = true
  group by p.id
  order by p.points desc;

create or replace view public.dashboard_kpis as
  select
    tenant_id,
    count(*) filter (where status = 'Erledigt')       as done,
    count(*) filter (where status = 'Ueberfaellig')   as overdue,
    count(*) filter (where status = 'In Bearbeitung') as in_progress,
    count(*) filter (where status = 'Offen')          as open,
    count(*)                                           as total
  from public.tasks
  group by tenant_id;

-- ─────────────────────────────────────────
-- 14. ERSTEN TENANT + ADMIN EINRICHTEN
-- ─────────────────────────────────────────
-- Schritt 1: Registriere dich normal in der App
-- Schritt 2: Fuehre diese SQL-Befehle manuell aus:
--
-- insert into public.tenants (name, slug)
--   values ('Meine Firma GmbH', 'meine-firma');
--
-- update public.profiles
--   set tenant_id = (select id from public.tenants where slug = 'meine-firma'),
--       role      = 'admin'
--   where id = 'DEINE-USER-ID-AUS-SUPABASE-AUTH';
--
-- Die User-ID findest du in:
-- Supabase Dashboard -> Authentication -> Users -> deine E-Mail -> ID kopieren
