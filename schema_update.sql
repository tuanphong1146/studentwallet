-- Chạy MỘT LẦN trong Supabase > SQL Editor nếu bạn đã chạy schema.sql trước đó
alter table public.expenses add column if not exists edit_count int not null default 0 check (edit_count between 0 and 3);
-- Bảng kiểm thử OCR không còn dùng, xóa đi (không ảnh hưởng gì nếu bạn chưa tạo)
drop table if exists public.ocr_tests;
