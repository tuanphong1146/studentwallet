-- =====================================================================
-- Student Wallet: Nhóm & Chia sẻ + Blockchain (bản bảo mật)
-- Chạy toàn bộ file trong Supabase > SQL Editor > Run.
-- File này chạy lại nhiều lần được (idempotent) và không xóa dữ liệu.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BẢNG (giữ nguyên các bảng bạn đã tạo, bổ sung cột còn thiếu)
-- ---------------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  user_code text unique not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  group_code text unique not null,
  name text not null,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
-- Code app đọc/ghi cột can_edit (quyền sửa), bảng cũ chưa có
alter table public.group_members add column if not exists can_edit boolean not null default false;
alter table public.group_members add column if not exists status text not null default 'active';

create table if not exists public.group_expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references auth.users on delete set null,   -- người mua
  member_name text,
  spent_on date not null,
  shop text not null,
  category text not null,
  amount numeric(15,2) not null check (amount > 0),
  is_paid boolean not null default true,
  edit_count int not null default 0 check (edit_count between 0 and 3),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.group_expenses add column if not exists member_name text;
alter table public.group_expenses add column if not exists is_paid boolean not null default true;
alter table public.group_expenses add column if not exists edit_count int not null default 0;
alter table public.group_expenses add column if not exists items jsonb not null default '[]'::jsonb;
create index if not exists group_expenses_group_idx on public.group_expenses (group_id, spent_on desc);

create table if not exists public.group_budgets (
  group_id uuid references public.groups on delete cascade not null,
  category text not null,
  amount numeric(15,2) not null check (amount >= 0),
  color text,
  threshold int not null default 80 check (threshold between 50 and 100),
  primary key (group_id, category)
);
alter table public.group_budgets add column if not exists color text;
alter table public.group_budgets add column if not exists threshold int not null default 80;

-- Thành viên thường chỉ được gửi khai báo nạp / phiếu duyệt của chính họ;
-- trạng thái xác nhận tiền và giải ngân nằm trong __vault_ledger__ do người có quyền sửa quản lý.
create table if not exists public.group_vault_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  actor_id uuid not null references auth.users on delete cascade,
  event_type text not null check (event_type in ('deposit_submitted', 'reimbursement_vote', 'approval_status_checked')),
  event_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (group_id, event_type, event_id, actor_id)
);
alter table public.group_vault_events drop constraint if exists group_vault_events_event_type_check;
alter table public.group_vault_events add constraint group_vault_events_event_type_check
  check (event_type in ('deposit_submitted', 'reimbursement_vote', 'approval_status_checked'));
create index if not exists group_vault_events_group_created_idx
  on public.group_vault_events (group_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2. HÀM TRỢ GIÚP (security definer để policy không bị đệ quy)
-- ---------------------------------------------------------------------
create or replace function public.is_group_owner(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.groups g where g.id = gid and g.owner_id = (select auth.uid()));
$$;

create or replace function public.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_group_owner(gid)
      or exists (select 1 from public.group_members m
                 where m.group_id = gid and m.user_id = (select auth.uid()) and coalesce(m.status, 'active') = 'active');
$$;

create or replace function public.can_edit_group(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_group_owner(gid)
      or exists (select 1 from public.group_members m
                 where m.group_id = gid and m.user_id = (select auth.uid()) and m.can_edit and coalesce(m.status, 'active') = 'active');
$$;

create or replace function public.is_vault_vote_tx(gid uuid, request_key text, actor uuid, tx text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_vault_events e
    where e.group_id = gid and e.event_type = 'reimbursement_vote'
      and e.event_id = request_key and e.actor_id = actor
      and e.payload->>'fujiTxHash' = tx
  );
$$;

revoke execute on function public.is_group_owner(uuid), public.is_group_member(uuid), public.can_edit_group(uuid) from public, anon;
grant  execute on function public.is_group_owner(uuid), public.is_group_member(uuid), public.can_edit_group(uuid) to authenticated;
revoke execute on function public.is_vault_vote_tx(uuid, text, uuid, text) from public, anon;
grant execute on function public.is_vault_vote_tx(uuid, text, uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 3. RLS: xóa policy cũ quá rộng (using true / with check true) rồi tạo lại
-- ---------------------------------------------------------------------
alter table public.user_profiles  enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.group_expenses enable row level security;
alter table public.group_budgets  enable row level security;
alter table public.group_vault_events enable row level security;
revoke all on public.group_vault_events from anon;
revoke update, delete on public.group_vault_events from authenticated;
grant select, insert on public.group_vault_events to authenticated;

drop policy if exists "Cho phép xem user_profiles" on public.user_profiles;
drop policy if exists "Cho phép cập nhật user_profiles của chính mình" on public.user_profiles;
drop policy if exists "Cho phép tạo user_profiles" on public.user_profiles;
drop policy if exists "profiles_select" on public.user_profiles;
drop policy if exists "profiles_insert" on public.user_profiles;
drop policy if exists "profiles_update" on public.user_profiles;
drop policy if exists "Thành viên nhóm xem được groups" on public.groups;
drop policy if exists "Chủ nhóm tạo group" on public.groups;
drop policy if exists "Xem group_members" on public.group_members;
drop policy if exists "Thêm thành viên vào nhóm" on public.group_members;
drop policy if exists "Xóa thành viên khỏi nhóm" on public.group_members;

-- Helper: kiểm tra 2 user có cùng nhóm (hoặc có lời mời/yêu cầu chung nhóm) hay không
create or replace function public.shares_group_with(target_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select target_uid = (select auth.uid())
      or exists (
        select 1
        from public.group_members gm1
        join public.group_members gm2 on gm1.group_id = gm2.group_id
        where gm1.user_id = (select auth.uid())
          and gm2.user_id = target_uid
      )
      or exists (
        select 1
        from public.groups g
        join public.group_members gm on gm.group_id = g.id
        where g.owner_id = (select auth.uid())
          and gm.user_id = target_uid
      );
$$;
revoke execute on function public.shares_group_with(uuid) from public, anon;
grant  execute on function public.shares_group_with(uuid) to authenticated;

-- Restricted Lookup RPCs: tra cứu chính xác theo mã (không cho phép quét toàn bảng user_profiles / groups)
create or replace function public.lookup_user_by_code(p_code text)
returns table (id uuid, user_code text, full_name text)
language sql stable security definer set search_path = '' as $$
  select up.id, up.user_code, up.full_name
  from public.user_profiles up
  where upper(trim(up.user_code)) = upper(trim(p_code))
  limit 1;
$$;
revoke execute on function public.lookup_user_by_code(text) from public, anon;
grant  execute on function public.lookup_user_by_code(text) to authenticated;

create or replace function public.lookup_group_by_code(p_code text)
returns table (id uuid, group_code text, name text)
language sql stable security definer set search_path = '' as $$
  select g.id, g.group_code, g.name
  from public.groups g
  where upper(trim(g.group_code)) = upper(trim(p_code))
  limit 1;
$$;
revoke execute on function public.lookup_group_by_code(text) from public, anon;
grant  execute on function public.lookup_group_by_code(text) to authenticated;

-- user_profiles: chỉ xem hồ sơ của chính mình hoặc thành viên cùng nhóm (không dùng using (true))
create policy "profiles_select" on public.user_profiles for select to authenticated
  using (public.shares_group_with(id));
create policy "profiles_insert" on public.user_profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update" on public.user_profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- groups: chỉ xem nhóm mình sở hữu hoặc đã tham gia / đang chờ duyệt (không dùng using (true))
drop policy if exists "groups_select" on public.groups;
drop policy if exists "groups_insert" on public.groups;
drop policy if exists "groups_update" on public.groups;
drop policy if exists "groups_delete" on public.groups;
create policy "groups_select" on public.groups for select to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.group_members m
      where m.group_id = id and m.user_id = (select auth.uid())
    )
  );
create policy "groups_insert" on public.groups for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "groups_update" on public.groups for update to authenticated
  using (owner_id = (select auth.uid())) with check (public.is_group_member(id));
create policy "groups_delete" on public.groups for delete to authenticated using (owner_id = (select auth.uid()));

-- group_members
drop policy if exists "gm_select" on public.group_members;
drop policy if exists "gm_insert" on public.group_members;
drop policy if exists "gm_update" on public.group_members;
drop policy if exists "gm_delete" on public.group_members;
create policy "gm_select" on public.group_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_group_member(group_id));
-- Chủ nhóm thêm trực tiếp (active); người ngoài nhập mã nhóm chỉ được gửi yêu cầu chờ duyệt (pending, can_edit = false)
create policy "gm_insert" on public.group_members for insert to authenticated
  with check (
    public.is_group_owner(group_id)
    or (user_id = (select auth.uid()) and can_edit = false and coalesce(status, 'pending') = 'pending')
  );
create policy "gm_update" on public.group_members for update to authenticated
  using (public.is_group_owner(group_id)) with check (public.is_group_owner(group_id));
-- Chủ nhóm xóa thành viên; thành viên tự rời nhóm
create policy "gm_delete" on public.group_members for delete to authenticated
  using (public.is_group_owner(group_id) or user_id = (select auth.uid()));

-- group_expenses: thành viên xem; chủ nhóm và người có can_edit được ghi
drop policy if exists "gx_select" on public.group_expenses;
drop policy if exists "gx_insert" on public.group_expenses;
drop policy if exists "gx_update" on public.group_expenses;
drop policy if exists "gx_delete" on public.group_expenses;
create policy "gx_select" on public.group_expenses for select to authenticated using (public.is_group_member(group_id));
create policy "gx_insert" on public.group_expenses for insert to authenticated with check (public.can_edit_group(group_id));
create policy "gx_update" on public.group_expenses for update to authenticated
  using (public.can_edit_group(group_id)) with check (public.can_edit_group(group_id));
create policy "gx_delete" on public.group_expenses for delete to authenticated using (public.can_edit_group(group_id));

-- group_budgets: tách quyền ngân sách thường (can_edit_group) và sổ quỹ / tài khoản quỹ (chỉ chủ quỹ is_group_owner)
drop policy if exists "gb_select" on public.group_budgets;
drop policy if exists "gb_write" on public.group_budgets;
drop policy if exists "gb_write_budgets" on public.group_budgets;
drop policy if exists "gb_write_vault_ledger" on public.group_budgets;
create policy "gb_select" on public.group_budgets for select to authenticated using (public.is_group_member(group_id));
create policy "gb_write_budgets" on public.group_budgets for all to authenticated
  using (category not in ('__vault_ledger__', '__vault_bank__') and public.can_edit_group(group_id))
  with check (category not in ('__vault_ledger__', '__vault_bank__') and public.can_edit_group(group_id));
create policy "gb_write_vault_ledger" on public.group_budgets for all to authenticated
  using (category in ('__vault_ledger__', '__vault_bank__') and public.is_group_owner(group_id))
  with check (category in ('__vault_ledger__', '__vault_bank__') and public.is_group_owner(group_id));

drop policy if exists "gve_select" on public.group_vault_events;
drop policy if exists "gve_insert" on public.group_vault_events;
drop policy if exists "gve_update" on public.group_vault_events;
drop policy if exists "gve_delete" on public.group_vault_events;
create policy "gve_select" on public.group_vault_events for select to authenticated
  using (public.is_group_member(group_id));
create policy "gve_insert" on public.group_vault_events for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and public.is_group_member(group_id)
    and (
      (event_type = 'deposit_submitted'
        and event_id = payload->>'id'
        and payload->>'userId' = (select auth.uid())::text
        and payload->>'status' = 'pending'
        and coalesce(payload->>'amountVnd', '') ~ '^[1-9][0-9]{0,11}$')
      or
      (event_type = 'reimbursement_vote'
        and event_id = payload->>'requestId'
        and payload->>'userId' = (select auth.uid())::text
        and exists (
          select 1
          from public.group_budgets b
          cross join lateral jsonb_array_elements(coalesce((b.color::jsonb)->'reimbursements', '[]'::jsonb)) r
          where b.group_id = group_vault_events.group_id
            and b.category = '__vault_ledger__'
            and r->>'id' = group_vault_events.event_id
            and r->>'status' = 'pending'
        ))
      or
      (event_type = 'approval_status_checked'
        and payload->>'userId' = (select auth.uid())::text
        and payload->>'requestId' is not null
        and event_id like (payload->>'requestId') || ':status:' || (select auth.uid())::text || ':%'
        and payload->>'txHash' ~ '^0x[a-fA-F0-9]{64}$'
        and payload->>'txStatus' in ('confirmed','pending','failed','not_recorded')
        and payload->>'auditStatus' in ('verified','mismatch','not_found','pending')
        and public.is_vault_vote_tx(group_vault_events.group_id, payload->>'requestId', (select auth.uid()), payload->>'txHash'))
    )
  );
revoke update, delete on public.group_vault_events from authenticated, anon;

-- ---------------------------------------------------------------------
-- 4. GIỚI HẠN SỬA 3 LẦN Ở PHÍA SERVER (không thể vượt bằng cách gọi API)
--    Khi đổi cửa hàng/ngày/số tiền/danh mục: edit_count phải tăng đúng 1 và còn dưới 3.
-- ---------------------------------------------------------------------
create or replace function public.enforce_edit_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.edit_count < old.edit_count then
    raise exception 'edit_count không được giảm';
  end if;
  if (new.shop, new.spent_on, new.category, new.amount)
     is distinct from (old.shop, old.spent_on, old.category, old.amount) then
    if old.edit_count >= 3 then
      raise exception 'Hóa đơn đã hết lượt sửa (3/3)';
    end if;
    if new.edit_count <> old.edit_count + 1 then
      raise exception 'Mỗi lần sửa phải tăng edit_count đúng 1';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists expenses_edit_limit on public.expenses;
create trigger expenses_edit_limit before update on public.expenses
  for each row execute function public.enforce_edit_limit();

drop trigger if exists group_expenses_edit_limit on public.group_expenses;
create trigger group_expenses_edit_limit before update on public.group_expenses
  for each row execute function public.enforce_edit_limit();

-- ---------------------------------------------------------------------
-- 5. BLOCKCHAIN (2 đoạn bạn đã soạn trong tab "Contract" + cột seal cho nhóm)
--    Lưu ý: code hiện tại chưa dùng các cột này, nó đang nhét seal vào group_expenses.items.
-- ---------------------------------------------------------------------
alter table public.expenses
  add column if not exists avax_tx_hash text,
  add column if not exists receipt_sha256 text,
  add column if not exists onchain_request_id integer;

alter table public.profiles add column if not exists wallet_address text;

alter table public.group_expenses add column if not exists avax_seal jsonb;

-- ---------------------------------------------------------------------
-- 6. VÍ CỦA THÀNH VIÊN + ĐỀ NGHỊ HOÀN TỪ QUỸ
--    wallet_address: ví nhận tiền hoàn (người dùng tự nhập, chỉ sửa được của chính mình
--    nhờ policy profiles_update ở trên). avax_reimburse: thông tin đề nghị hoàn trên chain.
-- ---------------------------------------------------------------------
alter table public.user_profiles add column if not exists bank_account jsonb;
alter table public.user_profiles add column if not exists wallet_address text;
alter table public.user_profiles drop constraint if exists user_profiles_wallet_format;
alter table public.user_profiles add constraint user_profiles_wallet_format
  check (wallet_address is null or wallet_address ~ '^0x[0-9a-fA-F]{40}$');

alter table public.group_expenses add column if not exists avax_reimburse jsonb;
