# Student Wallet (PWA + Supabase) - bản tối ưu điện thoại

## Cấu trúc thư mục
index.html, sw.js, manifest.webmanifest, config.js, icons/ (4 ảnh), schema.sql, schema_update.sql

## Cài đặt (lần đầu)
1. Supabase > SQL Editor: chạy `schema.sql` (hoặc `schema_update.sql` nếu đã chạy schema.sql trước đó).
2. `config.js`: dán Project URL và khóa publishable (khóa Secret tuyệt đối không dán vào đây).
3. Kéo cả thư mục vào app.netlify.com/drop, rồi đặt Site URL trong Supabase > Authentication > URL Configuration là link Netlify (thêm vào Redirect URLs để quên mật khẩu hoạt động).

## Lưu ý về tính năng Nhóm & Chia sẻ
Code dùng thêm các bảng `groups`, `group_members`, `group_budgets`, `group_expenses`, `user_profiles`. Các bảng này KHÔNG có trong schema.sql của thư mục này. Hãy giữ lại file SQL tạo các bảng đó nếu bạn đã có.

## Cập nhật app
Mỗi lần sửa code, đổi `sw-v10` thành `sw-v11` trong sw.js rồi tải lại lên Netlify.

## Trên điện thoại
- Dưới 860px: thanh menu dưới cùng (Tổng quan, Lịch sử, nút + , Ngân sách, Mục khác), thanh tiêu đề trên cùng có chuông và bánh răng.
- Nút + mở bảng chọn Quét hóa đơn hoặc Thêm thủ công. Báo cáo và Nhóm nằm ở Mục khác.
- Cài đặt và thông báo mở dạng bảng trượt từ dưới lên.
- Trang Quét hóa đơn có nút Chụp ảnh (mở camera sau) và Chọn từ thư viện.
- Bàn phím mở thì thanh menu dưới tự ẩn; ô nhập dùng cỡ chữ 16px để iPhone không tự phóng to.
- Android: menu bánh răng có mục Cài ứng dụng khi trình duyệt cho phép. iPhone: dùng Safari, Chia sẻ > Thêm vào Màn hình chính.
