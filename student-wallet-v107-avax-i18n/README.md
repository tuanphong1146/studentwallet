# Student Wallet (PWA + Supabase + Avalanche Fuji Audit Trail)

Ứng dụng quản lý chi tiêu cá nhân và quỹ nhóm minh bạch cho sinh viên, tách bạch rõ hai lớp:
1. **Dòng tiền thực tế qua Ngân hàng (VNĐ / VietQR):** Thành viên nạp quỹ và nhận hoàn tiền bằng chuyển khoản ngân hàng Việt Nam (VNĐ), không yêu cầu sinh viên sở hữu token để góp quỹ.
2. **Sổ kiểm chứng bất biến trên Avalanche Fuji C-Chain (Chain ID `43113`):** Lưu dấu vân tay SHA-256 của hóa đơn (`recordReceiptHash`) và nhật ký biểu quyết / giải ngân hoàn tiền (`recordApprovalAudit`) theo cơ chế chỉ nối thêm. Tiền góp và hoàn thực tế vẫn đi qua ngân hàng bằng VNĐ; Fuji chỉ dùng làm lớp kiểm toán, transaction cần AVAX testnet để trả gas.

---

## Cấu trúc thư mục chính
- `index.html`, `sw.js`, `manifest.webmanifest`, `config.js`, `i18n-extra.js`
- `js/app-core.js`, `js/ocr-fx.js`, `js/groups.js`, `js/pages.js`, `js/ui-shell.js`, `js/boot.js`
- `bank-vault.js`: Quản lý quỹ nhóm VNĐ (VietQR, khai báo chuyển khoản chờ đối soát, biểu quyết hoàn tiền >50%, khóa và kiểm chứng hóa đơn).
- `StudentGroupVaultV4.sol`: Smart contract Audit Registry (append-only, lịch sử receipt/approval và khởi tạo admin bằng chữ ký attestation).
- `avalanche-bridge.js`: Kết nối MetaMask / Core Wallet mạng Avalanche Fuji (`43113`), gửi giao dịch audit và đọc đối chiếu trực tiếp qua RPC `eth_call`.
- `supabase/functions/scan-receipt/index.ts`: Edge Function trích xuất hóa đơn bằng Gemini Vision (giữ nguyên giá từng dòng, trả cờ không chắc chắn, không tự thêm dòng ảo ép khớp tổng).
- `supabase/functions/authorize-group-admin/index.ts`: Chỉ ký attestation sau khi xác thực JWT Supabase, quyền sở hữu nhóm và ví admin đã lưu trong hồ sơ.
- `schema.sql`, `schema_update.sql`, `schema_groups_secure.sql`: Cấu trúc bảng và Row Level Security (RLS) trên Supabase.

---

## Cài đặt & Triển khai

### 1. Cấu hình Supabase
1. Vào **Supabase > SQL Editor**, chạy lần lượt `schema.sql` và `schema_groups_secure.sql`. Thành viên thường chỉ được thêm sự kiện khai báo nạp/phiếu vote của chính họ vào `group_vault_events`; không được ghi đè JSON `__vault_ledger__`.
2. Điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` vào `config.js`.
3. Thiết lập secret `GEMINI_API_KEY` và deploy Edge Function `scan-receipt` (`supabase/functions/scan-receipt/index.ts`).
4. Deploy Edge Function `authorize-group-admin` (`supabase/functions/authorize-group-admin/index.ts`). Đặt secrets `ADMIN_ATTESTOR_PRIVATE_KEY` (chỉ ở Supabase, không đưa vào frontend) và `FUJI_VAULT_CONTRACT_ADDRESS` sau khi contract đã deploy.

### 2. Triển khai Smart Contract Audit (`StudentGroupVaultV4.sol`) lên Avalanche Fuji
1. Tạo một khóa attestor riêng dùng cho backend; giữ private key trong Supabase secret `ADMIN_ATTESTOR_PRIVATE_KEY`. Lấy địa chỉ public tương ứng để truyền cho constructor.
2. Mở [remix.ethereum.org](https://remix.ethereum.org), tạo file `StudentGroupVaultV4.sol` và dán mã nguồn từ gói nộp.
3. Biên dịch với **Solidity `0.8.20` trở lên**.
4. Chọn **Injected Provider - MetaMask / Core Wallet** trên **Avalanche Fuji (Chain ID `43113`)**, truyền địa chỉ public attestor vào constructor rồi deploy.
5. Cập nhật cùng một địa chỉ contract trong `avalanche-bridge.js` và Supabase secret `FUJI_VAULT_CONTRACT_ADDRESS`. Bản V4 không tương thích ABI với contract V3 cũ.
6. Xác minh source code và constructor arguments trên Snowtrace Testnet. Khởi tạo admin chỉ thành công khi backend cấp chữ ký EIP-712 cho đúng chủ nhóm và đúng ví lưu trong hồ sơ.

### 3. Triển khai Frontend
- Kéo toàn bộ thư mục dự án lên Netlify (`app.netlify.com/drop`) hoặc hosting tĩnh bất kỳ.
- Khi cập nhật mã nguồn, tăng biến `V` trong `sw.js` (bản này là `sw-v99`) để trình duyệt làm mới cache PWA.

---

## Tính năng nổi bật
- **Quét hóa đơn AI & Cảnh báo đối soát OCR (`js/ocr-fx.js`):** Giữ nguyên giá từng dòng đọc được; không tự phân bổ chênh lệch thành phí giả. Khi tổng lệch hoặc OCR không chắc chắn, giao diện yêu cầu người dùng kiểm tra ảnh, sửa dữ liệu cần thiết và xác nhận trước khi lưu.
- **Quỹ chung chuyển khoản ngân hàng & Đối soát minh bạch (`bank-vault.js`):**
  - Mọi khoản khai báo chuyển khoản QR (kể cả của trưởng nhóm) đều khởi tạo ở trạng thái **`pending` (Chờ đối soát sao kê)** cho tới khi được xác nhận.
  - Đề nghị hoàn tiền từ quỹ yêu cầu **>50% thành viên nhóm đồng ý** trước khi mở khóa mã VietQR chuyển hoàn.
- **Niêm phong & Kiểm chứng hóa đơn trên Avalanche Fuji:**
  - Nút **`🔐 Khóa đối soát hóa đơn`** băm SHA-256 dữ liệu hóa đơn và gọi `recordReceiptHash(groupKey, expenseKey, receiptHash)` lên Fuji. Contract cấm ghi đè `receiptHashes[groupKey][expenseKey]`.
  - Khi bấm kiểm tra hóa đơn đã khóa, ứng dụng vừa tính lại hash dữ liệu hiện tại vừa gọi `eth_call` đọc trực tiếp `receiptHashes` từ smart contract trên Fuji để đối chiếu độc lập 3 chiều.
  - Nếu chưa kết nối ví Fuji khi duyệt nạp/hoàn tiền, ứng dụng vẫn cho phép ghi nhận nội bộ nhưng gắn nhãn cảnh báo **`⚠️ Chưa ghi Fuji`** rõ ràng, không gây hiểu nhầm đã có bằng chứng on-chain.
- **Quy ước key:** `groupKey = SHA-256(UTF-8("group:" + groupId))`; `expenseKey = SHA-256(UTF-8("expense:" + expenseId))`; `eventKey = SHA-256(UTF-8("audit:" + eventId))`. Hash payload cũng là SHA-256. Không dùng `keccak256` để tạo các key này.
- **Approval verification:** Mỗi vote và payout lưu tx hash, trạng thái transaction, explorer URL và audit hash; UI đọc approval history trên contract để đối chiếu snapshot đã lưu.
- **Giới hạn xác minh:** Gói này chứa source và encoding bridge, chưa bao gồm xác nhận compile/review ABI độc lập hoặc giao dịch Fuji đã chạy. Cần compile contract, xác minh source/constructor, rồi kiểm tra thực tế trên Fuji trước khi tuyên bố transaction đã hoạt động.


## Quy trình kiểm thử thực tế 3 tài khoản & 3 ví thật trên Avalanche Fuji (Bắt buộc trước Demo v99)
1. **Deploy `StudentGroupVaultV4.sol` lên Avalanche Fuji (Chain ID `43113`)**:
   - Dùng Remix / Foundry deploy `StudentGroupVaultV4.sol` với tham số `_authorizer` là địa chỉ ví ký EIP-712 của backend.
   - Verify source code trên Snowtrace Fuji (`https://testnet.snowtrace.io/`).
   - Cập nhật địa chỉ contract V4 mới vào **cả hai nơi**:
     1. `DEFAULT_CONTRACT_ADDRESS` trong `avalanche-bridge.js` (và xóa key `sw_fuji_audit_contract` trong LocalStorage nếu từng test địa chỉ cũ).
     2. Supabase Edge Function Secret `FUJI_AUDIT_CONTRACT` cho function `authorize-group-admin`.
2. **Chạy SQL cập nhật (`schema_groups_secure.sql`)**:
   - Đảm bảo `user_profiles` có 2 cột tách biệt: `bank_account jsonb` (tài khoản ngân hàng VND nhận hoàn tiền) và `wallet_address text` (địa chỉ ví EVM `0x...` dùng ký Fuji).
   - Đảm bảo RLS `gb_write_vault_ledger` chỉ cho phép `owner_id` (chủ quỹ) ghi `__vault_ledger__` và `__vault_bank__`.
3. **Kịch bản End-to-End 3 tài khoản + 3 ví Fuji thật**:
   - **Tài khoản 1 (Trưởng nhóm / Thủ quỹ — Ví Fuji #1)**: Tạo nhóm -> lưu STK ngân hàng cá nhân + lưu ví Fuji #1 -> bấm **Khởi tạo admin bằng attestation** -> xác nhận giao dịch trên Fuji.
   - **Tài khoản 2 (Thành viên A — Ví Fuji #2)** & **Tài khoản 3 (Thành viên B — Ví Fuji #3)**: Tham gia nhóm -> mỗi người lưu riêng STK ngân hàng (`bank_account`) và ví Fuji cá nhân (`wallet_address`) -> Trưởng nhóm cấp quyền Recorder (`setAuthorizedRecorder`) cho Ví #2 và Ví #3.
   - **Kiểm tra đối soát Revision & Approval**:
     - Thành viên A tạo hóa đơn, khóa SHA-256 lên Fuji (`v1`), sau đó sửa hóa đơn & nối revision (`v2`) -> bấm **Kiểm tra** phải khớp `v2` (latest).
     - Tạo đề nghị hoàn tiền -> Thành viên A (Ví #2) & Thành viên B (Ví #3) bấm **Đồng ý chi** ký on-chain -> Trưởng nhóm (Ví #1) quét VietQR hoàn tiền thật qua ngân hàng và xác nhận hoàn tiền lên Fuji -> bấm **Đối chiếu** xác nhận `latestMatch = true`.
