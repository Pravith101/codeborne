-- CP04: Player Attributes & Region Gates

-- 1. Add attribute_points to profiles
alter table public.profiles
add column attribute_points integer not null default 0 check (attribute_points >= 0);

-- 2. Drop the UPDATE policy on profiles to prevent client-side manipulation
drop policy if exists "Users can update their own profile" on public.profiles;

-- 3. Update complete_task RPC to award attribute_points
create or replace function public.complete_task(p_task_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_task record;
  v_profile record;
  v_current_xp integer;
  v_current_level integer;
  v_xp_req integer;
  v_initial_level integer;
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
  v_initial_level := v_profile.level;

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
    attribute_points = attribute_points + (v_current_level - v_initial_level),
    updated_at = timezone('utc'::text, now())
  where id = auth.uid();
end;
$$;

-- 4. Create spend_attribute_point RPC
create or replace function public.spend_attribute_point(p_attribute_name text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_profile record;
begin
  -- Check attribute name validity
  if p_attribute_name not in ('logic', 'focus', 'wisdom', 'mastery') then
    raise exception 'Invalid attribute name';
  end if;

  -- Lock profile
  select * into v_profile from public.profiles where id = auth.uid() for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_profile.attribute_points <= 0 then
    raise exception 'No unspent attribute points';
  end if;

  -- Update appropriate attribute dynamically using EXECUTE
  execute format('
    update public.profiles
    set
      %I = %I + 1,
      attribute_points = attribute_points - 1,
      updated_at = timezone(''utc''::text, now())
    where id = $1
  ', p_attribute_name, p_attribute_name)
  using auth.uid();

end;
$$;
