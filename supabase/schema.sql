create extension if not exists pgcrypto;

create type member_role as enum ('admin', 'member');
create type task_priority as enum ('low', 'medium', 'high');
create type task_status as enum ('todo', 'in_progress', 'done');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 90),
  description text not null default '' check (char_length(description) <= 500),
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 140),
  description text not null default '' check (char_length(description) <= 1200),
  due_date date not null,
  priority task_priority not null default 'medium',
  status task_status not null default 'todo',
  project_id uuid not null references projects(id) on delete cascade,
  assigned_to uuid not null references profiles(id) on delete restrict,
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_members_user_id_idx on project_members(user_id);
create index project_members_project_id_idx on project_members(project_id);
create index tasks_project_id_idx on tasks(project_id);
create index tasks_assigned_to_idx on tasks(assigned_to);
create index tasks_status_idx on tasks(status);
create index tasks_due_date_idx on tasks(due_date);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    lower(new.email)
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

create or replace function is_project_member(target_project_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from project_members
    where project_id = target_project_id and user_id = target_user_id
  );
$$;

create or replace function is_project_admin(target_project_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from project_members
    where project_id = target_project_id and user_id = target_user_id and role = 'admin'
  );
$$;

create or replace function create_project_with_admin(project_name text, project_description text)
returns projects
language plpgsql
security definer
set search_path = public
as $$
declare
  new_project projects;
begin
  insert into projects (name, description, created_by)
  values (project_name, coalesce(project_description, ''), auth.uid())
  returning * into new_project;

  insert into project_members (project_id, user_id, role)
  values (new_project.id, auth.uid(), 'admin');

  return new_project;
end;
$$;

create or replace function enforce_task_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_project_admin(old.project_id, auth.uid()) then
    if not is_project_member(new.project_id, new.assigned_to) then
      raise exception 'Assigned user must be a project member';
    end if;
    return new;
  end if;

  if old.assigned_to = auth.uid()
    and new.id = old.id
    and new.title = old.title
    and new.description = old.description
    and new.due_date = old.due_date
    and new.priority = old.priority
    and new.project_id = old.project_id
    and new.assigned_to = old.assigned_to
    and new.created_by = old.created_by
    and new.created_at = old.created_at then
    return new;
  end if;

  raise exception 'Members can update only their own task status';
end;
$$;

create trigger enforce_task_update_rules_before_update
before update on tasks
for each row execute function enforce_task_update_rules();

alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table tasks enable row level security;

create policy profiles_select_authenticated on profiles
for select to authenticated
using (true);

create policy profiles_update_self on profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy projects_select_members on projects
for select to authenticated
using (is_project_member(id, auth.uid()));

create policy projects_insert_self on projects
for insert to authenticated
with check (created_by = auth.uid());

create policy projects_update_admins on projects
for update to authenticated
using (is_project_admin(id, auth.uid()))
with check (is_project_admin(id, auth.uid()));

create policy projects_delete_admins on projects
for delete to authenticated
using (is_project_admin(id, auth.uid()));

create policy project_members_select_members on project_members
for select to authenticated
using (is_project_member(project_id, auth.uid()));

create policy project_members_insert_admins on project_members
for insert to authenticated
with check (is_project_admin(project_id, auth.uid()));

create policy project_members_update_admins on project_members
for update to authenticated
using (is_project_admin(project_id, auth.uid()))
with check (is_project_admin(project_id, auth.uid()));

create policy project_members_delete_admins on project_members
for delete to authenticated
using (is_project_admin(project_id, auth.uid()));

create policy tasks_select_visible on tasks
for select to authenticated
using (
  is_project_admin(project_id, auth.uid())
  or assigned_to = auth.uid()
);

create policy tasks_insert_admins on tasks
for insert to authenticated
with check (
  is_project_admin(project_id, auth.uid())
  and is_project_member(project_id, assigned_to)
  and created_by = auth.uid()
);

create policy tasks_update_admins_and_assignees on tasks
for update to authenticated
using (
  is_project_admin(project_id, auth.uid())
  or assigned_to = auth.uid()
)
with check (
  is_project_admin(project_id, auth.uid())
  or assigned_to = auth.uid()
);

create policy tasks_delete_admins on tasks
for delete to authenticated
using (is_project_admin(project_id, auth.uid()));
