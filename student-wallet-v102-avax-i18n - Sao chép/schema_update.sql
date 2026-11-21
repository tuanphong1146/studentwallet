-- Chạy MỘT LẦN trong Supabase > SQL Editor để lưu số thập phân (VD: 54.50 CHF) và đơn vị tiền tệ
alter table public.profiles add column if not exists currency text not null default 'VND';
alter table public.expenses add column if not exists edit_count int not null default 0 check (edit_count between 0 and 3);
alter table public.expenses add column if not exists currency text not null default 'VND';
alter table public.expenses alter column amount type numeric(15,2) using amount::numeric(15,2);
alter table public.expense_items alter column amount type numeric(15,2) using amount::numeric(15,2);
alter table public.budgets alter column amount type numeric(15,2) using amount::numeric(15,2);
alter table public.group_expenses add column if not exists currency text not null default 'VND';
alter table public.group_expenses alter column amount type numeric(15,2) using amount::numeric(15,2);
alter table public.group_budgets alter column amount type numeric(15,2) using amount::numeric(15,2);
drop table if exists public.ocr_tests;
