# THK17 Design System (DESIGN.md)
## Chuẩn Thẩm Mỹ Chống AI-Slop (Theo Triết Lý Impeccable & Taste-Skill)

### 1. Triết Lý & Phong Cách Chủ Đạo
- **The Bar (Thước đo):** Chuyên nghiệp, thanh lịch, tinh giản và tự tin như các sản phẩm công nghệ hàng đầu thế giới (*Figma*, *x.ai*, *Linear*, *Vercel*).
- **Loại bỏ triệt để các vết tích "AI Slop" thường gặp:**
  * ❌ Không dùng chữ chuyển màu lòe loẹt (`text-transparent bg-clip-text bg-gradient-to-r`). Trọng tâm thị giác đến từ kích thước, trọng số font (`font-bold`, `font-black`) và độ tương phản cao của màu trắng sáng `#F8FAFC` trên nền tối sâu.
  * ❌ Không dùng quầng sáng neon 0-offset bao quanh mọi thẻ (`box-shadow: 0 0 20px rgba(0,212,255,0.4)`). Chiều sâu thị giác được tạo bởi độ dời nhẹ trục Y (`0 12px 32px -8px rgba(0, 0, 0, 0.6)`) và viền biên tinh xảo 1px (`rgba(255, 255, 255, 0.08)`).
  * ❌ Không dùng các chi tiết trang trí cyberpunk rởm: góc ngoặc nhọn giả cầy (`corner-brackets`), dấu hồng tâm (`crosshair`), mã nhị phân rải khắp nơi, hay nhãn `01 // ...` dán tràn lan trên từng tiêu đề. Tiêu đề mạnh mẽ, tự đứng vững không cần nhãn phụ (eyebrow ban).
  * ❌ Không dùng subtitle dư thừa: Xóa bỏ triệt để các kicker, nhãn phụ hoặc câu diễn đạt lặp lại bên dưới tiêu đề. Tiêu đề mang đủ sức nặng tự thân.
  * ❌ Không dùng thẻ lồng trong thẻ (cards-in-cards) hay 4 thẻ chỉ số y hệt nhau kiểu template AI.
  * ❌ Không dùng monospace bừa bãi. Monospace (`JetBrains Mono`) chỉ dùng cho code C++, thời gian TKB, STT học sinh và thông số kỹ thuật thực tế.

### 2. Bảng Màu & Nền Kiến Trúc (Color & Canvas Tokens)
- **Nền Đa Tầng (Multi-Layer Canvas):**
  * `surface-abyss`: `#030712` (Xuyên suốt toàn bộ body, tạo độ sâu vô cực)
  * `ambient-glow`: Ánh sáng phân tán đa điểm (Radial Lighting 12% Sky Blue ở đỉnh đầu + 4% Bloom nhẹ tại trung tâm), mang lại chiều sâu mượt mà không gây vệt sọc vàng hay banding.
  * `dot-matrix`: Họa tiết ma trận vi điểm 28px kết hợp radial mask mềm mại, tăng cảm giác xúc giác công nghệ cao.
  * `surface-card`: `rgba(11, 15, 25, 0.85)` với viền `rgba(255, 255, 255, 0.08)`
  * `surface-elevated`: `rgba(15, 23, 42, 0.95)` dành cho thanh điều hướng và modal
- **Văn Bản (Typography):**
  * `text-primary`: `#F8FAFC` (Trắng băng độ tương phản cao, sắc nét)
  * `text-secondary`: `#94A3B8` (Slate xám trung tính, dễ đọc, êm mắt)
  * `text-muted`: `#64748B` (Thông tin phụ)
- **Điểm Nhấn (Accent & Tech):**
  * `accent-cyan`: `#0EA5E9` (Sky/Cyan công nghệ hiện đại, tự nhiên, không chói gắt)
  * `accent-blue`: `#2563EB` (Cobalt sang trọng của ngôn ngữ C++)
  * `status-active`: `#10B981` (Emerald biểu thị trực tuyến / đang học)

### 3. Cấu Trúc Khung Hình & Xử Lý Đa Phương Tiện (Layout & Media)
- **Equal Content Edges:** Toàn bộ nội dung tuân thủ lề căn đối xứng hoàn hảo, tối đa `max-w-[1440px]` căn giữa màn hình với padding bên đồng nhất.
- **Hỗ Trợ Mọi Định Dạng Ảnh (Universal Media Engine):**
  * Tích hợp bộ chuyển đổi tự động `heic2any` phía client, xử lý trơn tru mọi định dạng ảnh từ Apple (HEIC, HEIF) sang JPEG chất lượng cao mà không làm suy giảm độ phân giải.
  * Hỗ trợ đầy đủ các định dạng: PNG, JPG, JPEG, WEBP, AVIF, HEIC, HEIF, GIF, BMP, SVG, TIFF.
- **Controlled Section Height:** Mỗi phân khúc có nhịp thở rõ ràng, khoảng cách dọc (`py-16` đến `py-24`) thoáng đãng, phân cấp rõ rệt.
- **Tập trung vào Ảnh thật & Sản phẩm thật:**
  * Ảnh tập thể lớp `nen.webp` và chân dung Thầy chủ nhiệm `PD.webp` được đóng khung sắc sảo với tỉ lệ vàng, góc bo mềm mại `rounded-2xl`, bảo vệ viền tinh tế khi hover.
  * Các thẻ Album kỷ niệm hiển thị bố cục ảnh gọn gàng, hiệu ứng hover nhẹ nhàng (`scale-[1.02]` mượt mà).

### 4. Vi Tương Tác (Micro-Interactions)
- **Thẻ (Cards):** Nhấc nhẹ `translateY(-2px)` khi rê chuột, bóng đổ mở rộng êm ái, thời gian chuyển cảnh 250ms cubic-bezier(0.16, 1, 0.3, 1).
- **Nút Bấm (Buttons):** Nảy nhẹ khi hover, lún nhẹ `active:scale-[0.98]` khi bấm, font rõ ràng, chữ ngắn gọn chỉ rõ hành động thực tế.
- **Thanh Điều Hướng (Navbar):** Cố định trên cùng, nền kính mờ `backdrop-blur-md` tối giản, chỉ báo trang hiện tại tinh tế.
- **Trình Duyệt (Browser Surfaces):** Màu chọn chữ `::selection` thanh thoát, thanh cuộn mỏng 6px hài hòa, phông số bảng tabular cân chỉnh thẳng hàng.
