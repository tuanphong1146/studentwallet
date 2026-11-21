-- Student Wallet: chạy toàn bộ file này trong Supabase > SQL Editor > Run

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  alert_threshold int not null default 80 check (alert_threshold between 50 and 100),
  options jsonb not null default '{"budget":true,"weekly":true,"over":true}',
  scanned int not null default 0,
  currency text not null default 'VND',
  created_at timestamptz not null default now()
);

create table public.budgets (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null,
  amount numeric(15,2) not null check (amount >= 0),
  primary key (user_id, category)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  shop text not null,
  spent_on date not null,
  category text not null,
  amount numeric(15,2) not null check (amount > 0),
  currency text not null default 'VND',
  created_at timestamptz not null default now()
);
create index expenses_user_date_idx on public.expenses (user_id, spent_on desc);

create table public.expense_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  amount numeric(15,2) not null check (amount > 0)
);
create index expense_items_expense_idx on public.expense_items (expense_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  message text not null,
  color text not null default '--bl',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Bảo mật: mỗi người chỉ thấy và sửa dữ liệu của chính mình
alter table public.profiles enable row level security;
alter table public.budgets enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_items enable row level security;
alter table public.notifications enable row level security;

create policy "own rows" on public.profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.budgets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.expenses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.notifications for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.expense_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.expenses e where e.id = expense_id and e.user_id = (select auth.uid()))
  );

-- Khi có người đăng ký: tạo hồ sơ và ngân sách mặc định
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  insert into public.budgets (user_id, category, amount) values
    (new.id, 'Ăn uống', 4000000), (new.id, 'Mua sắm', 3000000),
    (new.id, 'Di chuyển', 2000000), (new.id, 'Giải trí', 1500000),
    (new.id, 'Học tập', 1500000), (new.id, 'Tiền nhà', 3000000),
    (new.id, 'Khác', 1000000);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Giới hạn sửa hóa đơn tối đa 3 lần
alter table public.expenses add column if not exists edit_count int not null default 0 check (edit_count between 0 and 3);
