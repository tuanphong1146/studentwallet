# Cấu hình Supabase cho đặt lại mật khẩu, đổi email và quét hóa đơn

## 1. Vì sao liên kết trong email đặt lại mật khẩu không mở được
Email vẫn gửi được, nhưng khi bấm vào, Supabase chỉ chuyển người dùng về app nếu địa chỉ đó nằm trong danh sách cho phép. Ba nguyên nhân thường gặp:

1. **Site URL / Redirect URLs chưa đúng** (hay gặp nhất). Mặc định Site URL là `http://localhost:3000`, nên liên kết dẫn về localhost và báo lỗi.
2. **Trình quét thư (Gmail, Outlook, antivirus) mở liên kết trước người dùng.** Liên kết chỉ dùng được một lần, nên khi người dùng bấm thì đã hết hạn (`otp_expired`).
3. Địa chỉ app có thêm `index.html` hoặc khác tên miền so với danh sách cho phép.

### Cách sửa
Vào Supabase > **Authentication > URL Configuration**:
- **Site URL**: địa chỉ app thật, ví dụ `https://ten-app.netlify.app`
- **Redirect URLs**: thêm `https://ten-app.netlify.app/**` (có dấu `/**`). Nếu muốn thử trên máy thì thêm cả `http://localhost:5500/**` hoặc cổng bạn đang dùng.

Code app đã được sửa để luôn gửi địa chỉ gốc của app (bỏ `index.html`), nên chỉ cần danh sách trên đúng là chạy.

## 2. Đặt lại bằng mã (không phụ thuộc liên kết)
Sau khi bấm "Gửi liên kết đặt lại mật khẩu", app hiện thêm ô **Mã xác nhận** và **Mật khẩu mới**. Cách này không bị trình quét thư làm hỏng. Để email có mã, sửa mẫu thư:

Supabase > **Authentication > Email Templates > Reset Password**, dán:

```html
<h2>Đặt lại mật khẩu Student Wallet</h2>
<p>Bấm vào liên kết để đặt mật khẩu mới:</p>
<p><a href="{{ .ConfirmationURL }}">Đặt lại mật khẩu</a></p>
<p>Nếu liên kết không mở được, nhập mã này vào ô "Mã xác nhận" trong app:</p>
<p style="font-size:24px;letter-spacing:4px"><b>{{ .Token }}</b></p>
```

## 3. Đổi email trong cửa sổ Tài khoản
Supabase gửi liên kết xác nhận đến email mới (và có thể cả email cũ, tùy cài đặt "Secure email change" trong Authentication > Sign In / Providers > Email). Email chỉ đổi sau khi người dùng bấm liên kết. Hãy kiểm tra mẫu thư **Change Email Address** cũng dùng `{{ .ConfirmationURL }}` và đã có Redirect URLs như mục 1.

## 4. Giới hạn gửi email
Dịch vụ email mặc định của Supabase chỉ gửi được vài thư mỗi giờ. Khi nhiều người cùng thử đặt lại mật khẩu sẽ báo "Thử quá nhiều lần". Để dùng thật, cấu hình SMTP riêng (Authentication > SMTP Settings).

## 5. Cập nhật Edge Functions (OCR và attestation admin)
Deploy lại function OCR sau khi cập nhật source. Prompt yêu cầu giữ nguyên giá từng dòng, không bù chênh lệch, trả confidence/uncertainFields; app bắt buộc người dùng kiểm tra và xác nhận nếu OCR lệch hoặc chưa chắc chắn.

```
supabase functions deploy scan-receipt
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Deploy thêm function cấp chữ ký khởi tạo admin. Function này xác thực Supabase JWT, quyền owner của group và ví đã lưu trong hồ sơ trước khi ký EIP-712.

```powershell
supabase functions deploy authorize-group-admin
supabase secrets set ADMIN_ATTESTOR_PRIVATE_KEY=YOUR_ATTESTOR_PRIVATE_KEY
supabase secrets set FUJI_VAULT_CONTRACT_ADDRESS=YOUR_DEPLOYED_V4_ADDRESS
```

Chỉ lưu private key attestor trong Supabase secret. Không đưa khóa này vào `config.js`, frontend, hoặc commit. Constructor của contract phải nhận public address tương ứng với private key trên.

## 6. Siết RLS quỹ nhóm
Chạy lại `schema_groups_secure.sql` sau khi cập nhật. Member thường không được UPDATE/INSERT trực tiếp vào dòng `__vault_ledger__`; khai báo nạp và vote được ghi append-only vào `group_vault_events`. Owner/editor mới được ghi sổ quỹ tổng hợp.
