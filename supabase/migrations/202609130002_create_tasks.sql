create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  topic text,
  difficulty text,
  xp_reward integer not null check (xp_reward >= 0),
  coin_reward integer not null check (coin_reward >= 0),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.tasks enable row level security;

-- Users can read their own tasks
drop policy if exists "Users can read their own tasks" on public.tasks;
create policy "Users can read their own tasks" on public.tasks
  for select to authenticated using (auth.uid() = user_id);

-- Users can delete their own tasks
drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks" on public.tasks
  for delete to authenticated using (auth.uid() = user_id);

-- Explicitly no INSERT or UPDATE policies. All inserts and updates go through security definer RPCs.

create or replace function public.add_custom_task(p_title text, p_description text, p_topic text, p_difficulty text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_xp_reward integer;
  v_coin_reward integer;
  v_task_id uuid;
begin
  if p_difficulty = 'Beginner' then
    v_xp_reward := 40; v_coin_reward := 10;
  elsif p_difficulty = 'Intermediate' then
    v_xp_reward := 70; v_coin_reward := 20;
  elsif p_difficulty = 'Advanced' then
    v_xp_reward := 100; v_coin_reward := 30;
  else
    raise exception 'Invalid difficulty';
  end if;

  insert into public.tasks (user_id, title, description, topic, difficulty, xp_reward, coin_reward)
  values (auth.uid(), p_title, p_description, p_topic, p_difficulty, v_xp_reward, v_coin_reward)
  returning id into v_task_id;

  return v_task_id;
end;
$$;

create or replace function public.complete_task(p_task_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_task record;
  v_profile record;
  v_current_xp integer;
  v_current_level integer;
  v_xp_req integer;
begin
  -- verify task belongs to authenticated user and is not completed
  select * into v_task from public.tasks
  where id = p_task_id and user_id = auth.uid() and not completed
  for update;

  if not found then
    raise exception 'Task not found or already completed';
  end if;

  -- mark task as completed
  update public.tasks
  set completed = true, completed_at = timezone('utc'::text, now())
  where id = p_task_id;

  -- get profile with lock
  select * into v_profile from public.profiles
  where id = auth.uid()
  for update;

  v_current_xp := v_profile.xp + v_task.xp_reward;
  v_current_level := v_profile.level;

  loop
    v_xp_req := floor(100 * power(1.5, v_current_level - 1));
    exit when v_current_xp < v_xp_req;
    v_current_xp := v_current_xp - v_xp_req;
    v_current_level := v_current_level + 1;
  end loop;

  -- update profile
  update public.profiles
  set
    xp = v_current_xp,
    level = v_current_level,
    coins = coins + v_task.coin_reward,
    updated_at = timezone('utc'::text, now())
  where id = auth.uid();
end;
$$;

-- Redefine handle_new_user to also add starter quests
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- create profile
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''))
  on conflict (id) do nothing;

  -- insert starter quests
  insert into public.tasks (user_id, title, description, topic, difficulty, xp_reward, coin_reward)
  values
    (new.id, 'The First Variable', 'Learn about variables and assign your first one.', 'Variables', 'Beginner', 40, 10),
    (new.id, 'Speak the Truth', 'Use the print function to output text to the console.', 'Input & Output', 'Beginner', 50, 12),
    (new.id, 'The Path of Conditions', 'Master the if statement to make choices.', 'if / elif / else', 'Beginner', 70, 15);

  return new;
end;
$$;
