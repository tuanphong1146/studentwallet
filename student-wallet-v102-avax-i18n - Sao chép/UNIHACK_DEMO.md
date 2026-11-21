# UniHack Demo Runbook — Student Wallet (Bank VND + Avalanche Fuji Audit Trail)

## 1. Kiến trúc hệ thống (Ngân hàng xử lý tiền + Blockchain lưu bằng chứng)
- **Mạng blockchain:** Avalanche Fuji C-Chain (Chain ID `43113`).
- **Tách bạch vai trò:**
  - **Ngân hàng Việt Nam (VietQR / VNĐ):** Xử lý toàn bộ dòng tiền thật (góp quỹ nhóm, lưu giữ số dư thực tế và chuyển khoản hoàn tiền cho thành viên đã ứng trước).
  - **Avalanche Fuji (`StudentGroupVaultV4.sol`):** Đóng vai trò sổ kiểm chứng bất biến (append-only audit registry) lưu dấu vân tay SHA-256 của hóa đơn và lịch sử biểu quyết / giải ngân hoàn tiền. Admin được khởi tạo bằng attestation từ Edge Function sau khi xác minh chủ nhóm. AVAX testnet chỉ dùng trả phí gas.
  - **Supabase (PostgreSQL + RLS + Edge Function):** Lưu danh tính người dùng, chi tiết món hàng trên hóa đơn, báo cáo ngân sách và trạng thái đồng bộ đa thiết bị.

---

## 2. Kịch bản Demo End-to-End (5 phút)

### Bước 1: Quét hóa đơn & Đối soát OCR trung thực
1. Mở trang **Quét hóa đơn**, tải lên ảnh hóa đơn mua đồ cho nhóm.
2. Chỉ ra AI được yêu cầu giữ nguyên giá từng dòng, không tạo dòng bù và trả trạng thái không chắc chắn khi không đọc rõ. Khi tổng món lệch hoặc confidence thấp, giao diện yêu cầu kiểm tra ảnh, sửa nếu cần và xác nhận trước khi lưu.

### Bước 2: Góp quỹ nhóm qua VietQR & Đối soát sao kê
1. Vào **Nhóm & Chia sẻ > tab Quỹ chung**.
2. Trưởng nhóm kết nối ví đã lưu trong hồ sơ, bấm **`🛡️ Khởi tạo / thử khởi tạo admin bằng attestation`**. Edge Function chỉ ký cho user đã xác thực là owner và đúng ví lưu trong hồ sơ. Sau đó dùng danh sách thành viên để cấp recorder cho các ví cần ghi audit.
3. Thành viên nhập số tiền VNĐ muốn góp, quét mã VietQR chuyển khoản vào tài khoản nhận quỹ của nhóm và bấm **`📤 Gửi khai báo đã chuyển khoản (Chờ thủ quỹ đối soát)`**. Đây là event riêng có RLS; thành viên thường không ghi trực tiếp JSON `__vault_ledger__`.
4. Chỉ ra giao dịch mới nằm ở trạng thái **`Chờ duyệt`** (kể cả khi trưởng nhóm tự khai báo cũng không tự cộng số dư ngay mà phải qua bước xác nhận đối soát).
5. Kết nối ví MetaMask / Core Wallet trên mạng **Avalanche Fuji (`43113`)** qua nút **`🦊 Kết nối ví Fuji (Gas Audit)`**, sau đó bấm **`✓ Duyệt đã nhận tiền`**. Giao dịch gọi `recordApprovalAudit()` lên Fuji và gắn link **`⛓️ Fuji Audit Tx`** ngay trên dòng lịch sử.

### Bước 3: Niêm phong hóa đơn lên Avalanche Fuji & Kiểm chứng chống sửa đổi
1. Sang tab **Lịch sử chi tiêu**, mở một khoản chi của nhóm và bấm **`🔐 Khóa đối soát hóa đơn`**. Ví ghi transaction cần được cấp recorder on-chain.
2. Ví Fuji ký giao dịch gọi `recordReceiptHash(groupKey, expenseKey, receiptHash)` (giá trị `0 AVAX`, chỉ tốn gas). Đợi giao dịch đạt trạng thái **`⛓️ Fuji Confirmed`**, mở link Snowtrace để chứng minh hash đã nằm trên chain.
3. Bấm vào nhãn **`🔐 Đã niêm phong quỹ · Kiểm tra`**: ứng dụng tự động tính lại SHA-256 hiện tại VÀ truy vấn trực tiếp `receiptHashes` trên smart contract Fuji qua RPC `eth_call`, xác nhận khớp 100%.
4. Thử chỉnh sửa số tiền hoặc tên món của hóa đơn đó rồi bấm **Kiểm tra** lại: hệ thống phát hiện ngay **`Cảnh báo: Dữ liệu hóa đơn đã bị sửa đổi!`** do hash hiện tại không khớp với hash bất biến trên Fuji.

### Bước 4: Biểu quyết đa số (>50%) & Hoàn tiền qua ngân hàng
1. Tại khoản chi đã duyệt, bấm **`🏦 Đề nghị hoàn tiền từ quỹ`**.
2. Các thành viên trong nhóm bấm **`👍 Đồng ý chi`** (mỗi phiếu đồng ý được lưu cùng trạng thái transaction; nếu có Fuji tx, UI có nút đọc/đối chiếu hash và mở approval history).
3. Khi đủ **>50% thành viên đồng ý**, nút **`📲 Quét QR hoàn tiền`** mở khóa cho thủ quỹ quét VietQR chuyển hoàn VNĐ cho người mua và ghi nhận sự kiện giải ngân lên Fuji (`recordApprovalAudit`).

---

## 3. Câu hỏi phản biện thường gặp & Câu trả lời trung thực
- **Tại sao không dùng AVAX làm tiền quỹ luôn?**
  - *Trả lời:* Sinh viên Việt Nam chi tiêu và chuyển khoản bằng VNĐ qua ngân hàng. Nếu bắt sinh viên mua/nạp tiền mã hóa để góp quỹ ăn uống hàng ngày sẽ tạo rào cản sử dụng và rủi ro biến động tỷ giá. Tách riêng **Ngân hàng giữ tiền VNĐ** và **Avalanche Fuji làm sổ kiểm chứng bất biến** giúp giữ trải nghiệm thực tế cho sinh viên nhưng vẫn đảm bảo minh bạch chống sửa dữ liệu sau duyệt.
- **Làm sao chống việc ghi đè hash cũ trên smart contract?**
  - *Trả lời:* `StudentGroupVaultV4.sol` áp dụng cơ chế write-once cho `receiptHashes[groupKey][expenseKey]` và lưu revisions/approval history append-only. Khởi tạo admin cần chữ ký EIP-712 attestor ràng buộc với chain, contract, groupKey, admin và deadline; public front-runner không thể tự đặt mình làm admin.
- **Nếu người duyệt chưa kết nối ví Fuji thì sao?**
  - *Trả lời:* Để không làm gián đoạn nghiệp vụ đời thường, thủ quỹ vẫn có thể xác nhận sổ quỹ nội bộ, nhưng giao diện sẽ gắn nhãn cảnh báo **`⚠️ Chưa ghi Fuji`** rõ ràng thay vì đánh lừa người dùng rằng giao dịch đã có bằng chứng on-chain.
- **Giới hạn hiện tại của bản nguyên mẫu (Prototype) là gì?**
  - *Trả lời:* Giao dịch ngân hàng hiện đối soát qua xác nhận của thủ quỹ/trưởng nhóm (chưa tích hợp sao kê ngân hàng tự động Open Banking) và phí gas Fuji do người vận hành ví testnet chi trả (chưa triển khai relayer trả gas thay người dùng cuối).


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
