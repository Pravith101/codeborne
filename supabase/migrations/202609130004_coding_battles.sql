-- CP05: Coding Battles and Boss Foundation

create table if not exists public.bosses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  region text not null,
  max_hp integer not null check (max_hp > 0),
  required_attribute text,
  required_attribute_value integer,
  reward_xp integer not null default 0,
  reward_coins integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.coding_challenges (
  id uuid primary key default gen_random_uuid(),
  boss_id uuid references public.bosses(id) on delete cascade,
  title text not null,
  prompt text not null,
  difficulty text not null,
  expected_output text,
  concept text not null,
  base_damage integer not null default 10,
  created_at timestamptz default now()
);

create table if not exists public.user_boss_progress (
  user_id uuid references auth.users(id) on delete cascade,
  boss_id uuid references public.bosses(id) on delete cascade,
  current_hp integer not null,
  defeated boolean not null default false,
  updated_at timestamptz default now(),
  primary key (user_id, boss_id)
);

alter table public.bosses enable row level security;
alter table public.coding_challenges enable row level security;
alter table public.user_boss_progress enable row level security;

-- Policies
create policy "Players can read bosses" on public.bosses for select to authenticated using (true);
create policy "Players can read challenges" on public.coding_challenges for select to authenticated using (true);
create policy "Players can read their own progress" on public.user_boss_progress for select to authenticated using (auth.uid() = user_id);

-- Seed Data (Only insert if not exists)
do $$
declare
  v_boss_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  if not exists (select 1 from public.bosses where id = v_boss_id) then
    insert into public.bosses (id, name, description, region, max_hp, required_attribute, required_attribute_value, reward_xp, reward_coins)
    values (
      v_boss_id,
      'Loop Warden',
      'An ancient sentinel made of twisted vines and repetitive logic.',
      'Loop Forest',
      100,
      'focus',
      8,
      100,
      50
    );

    -- Challenge 1
    insert into public.coding_challenges (boss_id, title, prompt, difficulty, concept, base_damage)
    values (
      v_boss_id,
      'The Sequential Call',
      'Write Python code that loops from 1 to 5 (inclusive) and prints each number. You must use a "for" loop and "range()".',
      'Beginner',
      'Basic for loop',
      10
    );

    -- Challenge 2
    insert into public.coding_challenges (boss_id, title, prompt, difficulty, concept, base_damage)
    values (
      v_boss_id,
      'Echoes of the Forest',
      'Write a Python loop that prints the exact string "Loop" exactly 3 times.',
      'Beginner',
      'Repetition',
      10
    );

    -- Challenge 3
    insert into public.coding_challenges (boss_id, title, prompt, difficulty, concept, base_damage)
    values (
      v_boss_id,
      'Even Stepping',
      'Use a loop to print the even numbers 2, 4, 6, 8, and 10.',
      'Intermediate',
      'Range steps or conditions',
      10
    );
  end if;
end $$;

-- RPC to start or resume a boss battle
create or replace function public.start_boss_battle(p_boss_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_boss record;
  v_hp integer;
begin
  select * into v_boss from public.bosses where id = p_boss_id;
  if not found then raise exception 'Boss not found'; end if;

  insert into public.user_boss_progress (user_id, boss_id, current_hp, defeated)
  values (auth.uid(), p_boss_id, v_boss.max_hp, false)
  on conflict (user_id, boss_id) do update set updated_at = now()
  returning current_hp into v_hp;

  return v_hp;
end;
$$;

-- Secure evaluator RPC
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
  
  if v_chal.title = 'The Sequential Call' then
    if v_normalized_answer like '%for%inrange(1,6):print(%)%' then
      v_damage := 30; v_tier := 'PERFECT';
    elsif v_normalized_answer like '%for%inrange(5):print(%)%' or v_normalized_answer like '%while%' then
      v_damage := 20; v_tier := 'GOOD';
    elsif v_normalized_answer like '%print%' then
      v_damage := 10; v_tier := 'PARTIAL';
    end if;
  elsif v_chal.title = 'Echoes of the Forest' then
    if v_normalized_answer like '%for%inrange(3):print("loop")%' or v_normalized_answer like '%for%inrange(3):print(''loop'')%' then
      v_damage := 30; v_tier := 'PERFECT';
    elsif v_normalized_answer like '%print("loop")%print("loop")%print("loop")%' then
      v_damage := 20; v_tier := 'GOOD';
    elsif v_normalized_answer like '%print%' then
      v_damage := 10; v_tier := 'PARTIAL';
    end if;
  elsif v_chal.title = 'Even Stepping' then
    if v_normalized_answer like '%for%inrange(2,11,2):print(%)%' then
      v_damage := 30; v_tier := 'PERFECT';
    elsif v_normalized_answer like '%if%2==0:print(%)%' then
      v_damage := 20; v_tier := 'GOOD';
    elsif v_normalized_answer like '%print%' then
      v_damage := 10; v_tier := 'PARTIAL';
    end if;
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
