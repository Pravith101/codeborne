-- CP06: Coins, Cosmetic Shop & Character Customization

create table if not exists public.cosmetics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cosmetic_type text not null check (cosmetic_type in ('cloak', 'head', 'armor', 'aura')),
  price integer not null check (price >= 0),
  asset_key text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.user_cosmetics (
  user_id uuid references auth.users(id) on delete cascade,
  cosmetic_id uuid references public.cosmetics(id) on delete cascade,
  purchased_at timestamptz default now(),
  equipped boolean not null default false,
  primary key (user_id, cosmetic_id)
);

alter table public.cosmetics enable row level security;
alter table public.user_cosmetics enable row level security;

-- Policies
create policy "Anyone can read cosmetics" on public.cosmetics for select using (true);
create policy "Players can read own user_cosmetics" on public.user_cosmetics for select to authenticated using (auth.uid() = user_id);

-- Seed Data
do $$
begin
  insert into public.cosmetics (name, description, cosmetic_type, price, asset_key)
  values 
    ('Wanderer''s Cloak', 'A tattered dusty cloak woven for long journeys.', 'cloak', 50, 'cloak-wanderer'),
    ('Scholar''s Hood', 'A deep hood that aids in absolute focus.', 'head', 75, 'head-scholar'),
    ('Python Knight', 'Heavy shoulder plates bearing the snake crest.', 'armor', 150, 'armor-python'),
    ('Ember Aura', 'A swirling aura of low-level magic.', 'aura', 200, 'aura-ember'),
    ('Verdant Mantle', 'A majestic cape granted to the masters of the forest.', 'cloak', 300, 'cloak-verdant'),
    ('Ancient Crown', 'A golden relic of the old syntax lords.', 'head', 400, 'head-crown')
  on conflict (asset_key) do nothing;
end $$;


-- Secure Purchase RPC
create or replace function public.purchase_cosmetic(p_cosmetic_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_cosmetic record;
  v_profile record;
  v_exists boolean;
begin
  -- 1. Check cosmetic exists
  select * into v_cosmetic from public.cosmetics where id = p_cosmetic_id;
  if not found then raise exception 'Cosmetic not found'; end if;

  -- 2. Check ownership
  select exists(
    select 1 from public.user_cosmetics 
    where user_id = auth.uid() and cosmetic_id = p_cosmetic_id
  ) into v_exists;
  
  if v_exists then raise exception 'Already owned'; end if;

  -- 3. Check and deduct coins securely
  select * into v_profile from public.profiles where id = auth.uid() for update;
  if v_profile is null then raise exception 'Profile not found'; end if;
  
  if v_profile.coins < v_cosmetic.price then
    raise exception 'Insufficient coins';
  end if;

  update public.profiles
  set coins = coins - v_cosmetic.price,
      updated_at = now()
  where id = auth.uid();

  -- 4. Grant ownership
  insert into public.user_cosmetics (user_id, cosmetic_id, equipped)
  values (auth.uid(), p_cosmetic_id, false);

  return json_build_object('success', true, 'remaining_coins', v_profile.coins - v_cosmetic.price);
end;
$$;


-- Secure Equip RPC
create or replace function public.equip_cosmetic(p_cosmetic_id uuid, p_equip boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_cosmetic record;
  v_ownership record;
begin
  -- 1. Get cosmetic details
  select * into v_cosmetic from public.cosmetics where id = p_cosmetic_id;
  if not found then raise exception 'Cosmetic not found'; end if;

  -- 2. Verify ownership and lock
  select * into v_ownership from public.user_cosmetics 
  where user_id = auth.uid() and cosmetic_id = p_cosmetic_id for update;

  if not found then raise exception 'Not owned'; end if;

  -- 3. Handle equipping
  if p_equip then
    -- Unequip existing items of the SAME TYPE
    update public.user_cosmetics uc
    set equipped = false
    from public.cosmetics c
    where uc.cosmetic_id = c.id 
      and c.cosmetic_type = v_cosmetic.cosmetic_type
      and uc.user_id = auth.uid()
      and uc.cosmetic_id != p_cosmetic_id
      and uc.equipped = true;

    -- Equip the targeted item
    update public.user_cosmetics
    set equipped = true
    where user_id = auth.uid() and cosmetic_id = p_cosmetic_id;
  else
    -- Unequip
    update public.user_cosmetics
    set equipped = false
    where user_id = auth.uid() and cosmetic_id = p_cosmetic_id;
  end if;

  return json_build_object('success', true);
end;
$$;
