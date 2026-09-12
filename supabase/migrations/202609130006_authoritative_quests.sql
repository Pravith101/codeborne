-- CP06.4: Authoritative Quest Completion Backend (Refactored)

-- 1. Add stable objective keys to tasks
alter table public.tasks 
add column if not exists objective_type text,
add column if not exists objective_key text;

-- 2. Add stable objective keys to challenges
alter table public.coding_challenges 
add column if not exists objective_key text unique;

-- 3. Backfill data for existing records
update public.coding_challenges set objective_key = 'seq_call' where title = 'The Sequential Call' and objective_key is null;
update public.coding_challenges set objective_key = 'echoes_of_forest' where title = 'Echoes of the Forest' and objective_key is null;
update public.coding_challenges set objective_key = 'even_stepping' where title = 'Even Stepping' and objective_key is null;

update public.tasks set objective_type = 'coding_challenge', objective_key = 'variables_1' where title = 'The First Variable' and objective_key is null;
update public.tasks set objective_type = 'coding_challenge', objective_key = 'echoes_of_forest' where title = 'Speak the Truth' and objective_key is null;
update public.tasks set objective_type = 'coding_challenge', objective_key = 'even_stepping' where title = 'The Path of Conditions' and objective_key is null;

-- 4. Create authoritative completions table
create table if not exists public.completed_challenges (
  user_id uuid references auth.users(id) on delete cascade,
  challenge_id uuid references public.coding_challenges(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (user_id, challenge_id)
);

alter table public.completed_challenges enable row level security;

-- Only server can insert. Users can read their own completions.
drop policy if exists "Players can read their own completed challenges" on public.completed_challenges;
create policy "Players can read their own completed challenges" 
on public.completed_challenges for select to authenticated 
using (auth.uid() = user_id);

-- 5. Authoritative RPCs

-- Update submit_battle_answer to grade by objective_key and insert into completed_challenges
create or replace function public.submit_battle_answer(p_boss_id uuid, p_challenge_id uuid, p_answer text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_boss record;
  v_chal record;
  v_prog record;
  v_profile record;
  v_damage integer := 0;
  v_tier text := 'WRONG';
  v_normalized_answer text;
  v_current_xp integer;
  v_current_level integer;
  v_xp_req integer;
  v_initial_level integer;
begin
  -- 1. Check if boss exists
  select * into v_boss from public.bosses where id = p_boss_id;
  if not found then raise exception 'Boss not found'; end if;

  -- 2. Check if challenge belongs to boss
  select * into v_chal from public.coding_challenges where id = p_challenge_id and boss_id = p_boss_id;
  if not found then raise exception 'Challenge not found'; end if;

  -- 3. Check attribute prereq
  execute format('select %I from public.profiles where id = $1', v_boss.required_attribute)
  into v_profile using auth.uid();

  if v_profile is null or v_profile < v_boss.required_attribute_value then
    raise exception 'Required attribute not met';
  end if;

  -- 4. Get active battle state
  select * into v_prog from public.user_boss_progress
  where user_id = auth.uid() and boss_id = p_boss_id
  for update;

  if not found then raise exception 'Battle not started'; end if;
  if v_prog.defeated then
    return json_build_object('damage', 0, 'tier', 'DEFEATED', 'remaining_hp', 0, 'defeated', true);
  end if;

  -- 5. Safe Predefined Evaluation
  v_normalized_answer := lower(regexp_replace(p_answer, '\s+', '', 'g'));
  
  if v_chal.objective_key = 'seq_call' then
    if v_normalized_answer like '%for%inrange(1,6):print(%)%' then
      v_damage := 30; v_tier := 'PERFECT';
    elsif v_normalized_answer like '%for%inrange(5):print(%)%' or v_normalized_answer like '%while%' then
      v_damage := 20; v_tier := 'GOOD';
    elsif v_normalized_answer like '%print%' then
      v_damage := 10; v_tier := 'PARTIAL';
    end if;
  elsif v_chal.objective_key = 'echoes_of_forest' then
    if v_normalized_answer like '%for%inrange(3):print("loop")%' or v_normalized_answer like '%for%inrange(3):print(''loop'')%' then
      v_damage := 30; v_tier := 'PERFECT';
    elsif v_normalized_answer like '%print("loop")%print("loop")%print("loop")%' then
      v_damage := 20; v_tier := 'GOOD';
    elsif v_normalized_answer like '%print%' then
      v_damage := 10; v_tier := 'PARTIAL';
    end if;
  elsif v_chal.objective_key = 'even_stepping' then
    if v_normalized_answer like '%for%inrange(2,11,2):print(%)%' then
      v_damage := 30; v_tier := 'PERFECT';
    elsif v_normalized_answer like '%if%2==0:print(%)%' then
      v_damage := 20; v_tier := 'GOOD';
    elsif v_normalized_answer like '%print%' then
      v_damage := 10; v_tier := 'PARTIAL';
    end if;
  end if;

  -- AUTHORITATIVE COMPLETION TRACKING
  if v_tier = 'PERFECT' or v_tier = 'GOOD' then
    insert into public.completed_challenges (user_id, challenge_id)
    values (auth.uid(), p_challenge_id)
    on conflict do nothing;
  end if;

  -- 6. Apply Damage & check defeat
  v_prog.current_hp := greatest(0, v_prog.current_hp - v_damage);
  
  update public.user_boss_progress
  set current_hp = v_prog.current_hp,
      defeated = (v_prog.current_hp = 0),
      updated_at = now()
  where user_id = auth.uid() and boss_id = p_boss_id;

  -- 7. Apply rewards if defeated
  if v_prog.current_hp = 0 then
    select * into v_profile from public.profiles where id = auth.uid() for update;
    v_current_xp := v_profile.xp + v_boss.reward_xp;
    v_current_level := v_profile.level;
    v_initial_level := v_profile.level;

    loop
      v_xp_req := floor(100 * power(1.5, v_current_level - 1));
      exit when v_current_xp < v_xp_req;
      v_current_xp := v_current_xp - v_xp_req;
      v_current_level := v_current_level + 1;
    end loop;

    update public.profiles
    set xp = v_current_xp,
        level = v_current_level,
        coins = coins + v_boss.reward_coins,
        attribute_points = attribute_points + (v_current_level - v_initial_level),
        updated_at = now()
    where id = auth.uid();
  end if;

  return json_build_object(
    'damage', v_damage,
    'tier', v_tier,
    'remaining_hp', v_prog.current_hp,
    'defeated', (v_prog.current_hp = 0)
  );
end;
$$;

-- Update complete_task to verify requirements by objective_type/objective_key
create or replace function public.complete_task(p_task_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_task record;
  v_profile record;
  v_current_xp integer;
  v_current_level integer;
  v_xp_req integer;
  v_req_challenge_id uuid;
  v_has_completed boolean;
begin
  -- verify task belongs to authenticated user and is not completed
  select * into v_task from public.tasks
  where id = p_task_id and user_id = auth.uid() and not completed
  for update;

  if not found then
    raise exception 'Task not found or already completed';
  end if;

  -- ---------------------------------------------------------
  -- AUTHORITATIVE GAMEPLAY VERIFICATION
  -- ---------------------------------------------------------
  if v_task.objective_type = 'coding_challenge' then
    if v_task.objective_key = 'variables_1' then
       raise exception 'Objective not verifiable: Missing variable gameplay challenge.';
    end if;

    select id into v_req_challenge_id from public.coding_challenges where objective_key = v_task.objective_key;
    if v_req_challenge_id is null then
       raise exception 'Objective not verifiable: Unknown challenge key.';
    end if;

    select exists(select 1 from public.completed_challenges where user_id = auth.uid() and challenge_id = v_req_challenge_id) into v_has_completed;
    if not v_has_completed then
      raise exception 'Objective not verifiable: Required challenge not completed.';
    end if;
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

  update public.profiles
  set
    xp = v_current_xp,
    level = v_current_level,
    coins = coins + v_task.coin_reward,
    updated_at = timezone('utc'::text, now())
  where id = auth.uid();
end;
$$;

-- 6. Update handle_new_user to assign objective keys to new players
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- create profile
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''))
  on conflict (id) do nothing;

  -- insert starter quests with stable objective keys
  insert into public.tasks (user_id, title, description, topic, difficulty, xp_reward, coin_reward, objective_type, objective_key)
  values
    (new.id, 'The First Variable', 'Learn about variables and assign your first one.', 'Variables', 'Beginner', 40, 10, 'coding_challenge', 'variables_1'),
    (new.id, 'Speak the Truth', 'Use the print function to output text to the console.', 'Input & Output', 'Beginner', 50, 12, 'coding_challenge', 'echoes_of_forest'),
    (new.id, 'The Path of Conditions', 'Master the if statement to make choices.', 'if / elif / else', 'Beginner', 70, 15, 'coding_challenge', 'even_stepping');

  return new;
end;
$$;

NOTIFY pgrst, 'reload schema';
