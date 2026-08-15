# Lạc Việt Cinema — README.md

<div align="center">

# Lạc Việt Cinema

### Mở phim, chạm hồn Việt.

Nền tảng xem phim đa nguồn với giao diện hiện đại, hỗ trợ **Vietsub**, **Thuyết minh**, **HLS**, **Embed**, đồng bộ tài khoản và nhiều tính năng cá nhân hóa trải nghiệm xem phim.

**Website:** `https://lacvietfilm.vercel.app`

**Lovable:** `https://lacvietfilm.lovable.app`

</div>

---

## Giới thiệu

**Lạc Việt Cinema** là ứng dụng web xem phim được xây dựng theo hướng hiện đại, responsive và tập trung vào trải nghiệm người dùng.

Hệ thống tổng hợp dữ liệu từ nhiều nguồn API, cho phép người dùng chủ động chuyển nguồn khi một API gặp sự cố hoặc có tốc độ phản hồi không tốt.

Ngoài việc xem phim, Lạc Việt Cinema còn cung cấp hệ thống tài khoản, lịch sử xem, yêu thích, xem sau, bộ sưu tập, bình luận, đánh giá, thông báo và phòng xem chung.

> Nội dung và khả năng phát phim phụ thuộc vào API cùng máy chủ của các bên cung cấp dữ liệu.

---

## Nguồn dữ liệu

Lạc Việt Cinema hiện hỗ trợ:

| Nguồn  | Dữ liệu phim | HLS | Embed | Ping |
| ------ | :----------: | :-: | :---: | :--: |
| KKPhim |      Có      |  Có |   Có  |  Có  |
| OPhim  |      Có      |  Có |   Có  |  Có  |
| NguonC |      Có      |  —  |   Có  |  Có  |
| VSMov  |      Có      |  Có |   Có  |  Có  |

Hệ thống kiểm tra độ trễ của từng API định kỳ và hiển thị ping trực tiếp để người dùng có thể lựa chọn nguồn phù hợp.

---

## Tính năng chính

### Trình phát phim

* Phát trực tiếp bằng **HLS / m3u8**
* Phát bằng **Embed**
* Chuyển thủ công giữa HLS và Embed
* Tự động fallback sang Embed khi HLS không phát được
* Tự phục hồi một số lỗi media của HLS
* Tự động lựa chọn chất lượng video
* Chọn chất lượng HLS thủ công
* Điều chỉnh tốc độ phát
* Ghi nhớ tiến độ xem
* Tiếp tục xem từ vị trí trước đó
* Bỏ qua intro
* Hiển thị tập tiếp theo
* Tự động chuyển tập
* Hỗ trợ toàn màn hình
* Hỗ trợ Picture-in-Picture tùy trình duyệt
* Tối ưu cho desktop, mobile và thiết bị TV

### Quản lý tập phim

Server phim được tự động phân loại theo:

* Vietsub
* Thuyết minh
* Server khác

Danh sách tập dài được chia thành từng nhóm:

```text
1–10
11–20
21–30
31–40
...
```

Giúp điều hướng nhanh hơn đối với phim bộ có số lượng tập lớn.

### Chuyển nguồn API

Người dùng có thể chuyển giữa:

```text
KKPhim
OPhim
NguonC
VSMov
```

Ping của từng nguồn được cập nhật định kỳ để hỗ trợ lựa chọn máy chủ có tốc độ phản hồi tốt.

### Tài khoản

Hệ thống xác thực sử dụng **Supabase Auth**.

Hỗ trợ:

* Đăng ký tài khoản
* Đăng nhập bằng email và mật khẩu
* Magic Link
* Đăng nhập Google
* Xác minh email
* Quên mật khẩu
* Đặt lại mật khẩu
* Hồ sơ người dùng

### Cá nhân hóa

Người dùng đăng nhập có thể sử dụng:

* Phim yêu thích
* Danh sách xem sau
* Lịch sử xem
* Tiếp tục xem
* Theo dõi phim
* Bộ sưu tập phim
* Cài đặt trình phát
* Lưu chất lượng mặc định
* Lưu tốc độ phát
* Chọn ngôn ngữ server ưu tiên

### Tương tác cộng đồng

Hệ thống bao gồm:

* Bình luận
* Đánh giá phim
* Theo dõi
* Thông báo
* Watch Party / xem phim cùng nhau

### Bảng Vàng

Bảng xếp hạng phim theo lượt xem thời gian thực với các khoảng:

```text
Hôm nay
Tuần
Tháng
Mọi lúc
```

Có thể lọc theo loại phim và nguồn dữ liệu.

### Khám phá phim

Các khu vực chính bao gồm:

* Trang chủ
* Phim mới cập nhật
* Tìm kiếm
* Duyệt theo thể loại
* Duyệt theo quốc gia
* Bộ sưu tập
* Phim sắp chiếu
* Phim yêu thích
* Lịch sử
* Danh sách xem sau
* Trang cá nhân
* Thông báo

---

## Công nghệ sử dụng

| Thành phần         | Công nghệ       |
| ------------------ | --------------- |
| Frontend           | React 19        |
| Ngôn ngữ           | TypeScript      |
| Framework          | TanStack Start  |
| Router             | TanStack Router |
| Build Tool         | Vite            |
| Styling            | Tailwind CSS 4  |
| UI primitives      | Radix UI        |
| Animation          | Framer Motion   |
| Backend / Database | Supabase        |
| Authentication     | Supabase Auth   |
| Data fetching      | TanStack Query  |
| Video              | HLS.js          |
| Validation         | Zod             |
| Forms              | React Hook Form |
| Icons              | Lucide React    |
| Charts             | Recharts        |

---

## Cấu trúc dự án

```text
lacvietfilm/
├── public/
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── Player.tsx
│   │   ├── PlayerHost.tsx
│   │   ├── MovieCard.tsx
│   │   ├── MovieRow.tsx
│   │   ├── SourcePing.tsx
│   │   ├── GoldBoard.tsx
│   │   ├── CommentsSection.tsx
│   │   ├── ContinueWatching.tsx
│   │   └── ...
│   │
│   ├── hooks/
│   │
│   ├── integrations/
│   │
│   ├── lib/
│   │   ├── sources/
│   │   │   └── vsmov.ts
│   │   ├── api.ts
│   │   ├── browse.ts
│   │   ├── oauth.ts
│   │   ├── progress.ts
│   │   ├── settings.tsx
│   │   └── ...
│   │
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── auth.tsx
│   │   ├── search.tsx
│   │   ├── movie.$slug.tsx
│   │   ├── watch.$slug.tsx
│   │   ├── history.tsx
│   │   ├── favorites.tsx
│   │   ├── watchlist.tsx
│   │   ├── collections.index.tsx
│   │   ├── notifications.tsx
│   │   ├── party.$code.tsx
│   │   └── ...
│   │
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
│
├── supabase/
│   ├── migrations/
│   └── config.toml
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── DEPLOY_VERCEL.md
└── README.md
```

---

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/lacvietfilm/lacvietfilm.git
cd lacvietfilm
```

### 2. Cài dependency

Với npm:

```bash
npm install
```

Hoặc Bun:

```bash
bun install
```

### 3. Cấu hình biến môi trường

Tạo file `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id

SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_PROJECT_ID=your_supabase_project_id
```

> Không đưa `service_role` key hoặc các secret có quyền quản trị vào mã nguồn frontend.

### 4. Chạy development server

```bash
npm run dev
```

Sau đó mở địa chỉ được Vite hiển thị trong terminal.

---

## Các lệnh

```bash
# Development
npm run dev

# Production build
npm run build

# Development build
npm run build:dev

# Preview production build
npm run preview

# Kiểm tra ESLint
npm run lint

# Format source code
npm run format
```

---

## Supabase

Lạc Việt Cinema sử dụng Supabase cho các chức năng liên quan đến tài khoản và dữ liệu người dùng.

Database migrations nằm tại:

```text
supabase/migrations/
```

Khi tự triển khai dự án, cần cấu hình Supabase tương ứng và áp dụng migrations cần thiết trước khi sử dụng đầy đủ các tính năng.

---

## Google OAuth

Để đăng nhập bằng Google trên bản triển khai riêng, cần:

1. Tạo OAuth Client trong Google Cloud Console.
2. Bật Google Provider trong Supabase Authentication.
3. Cấu hình Client ID và Client Secret.
4. Thêm callback URL của Supabase vào Google OAuth.
5. Thêm domain ứng dụng vào danh sách Redirect URLs của Supabase.

---

## Deploy Vercel

Build command:

```bash
npm run build
```

Ứng dụng sử dụng Nitro để tạo output phù hợp với Vercel.

Nếu môi trường triển khai không tự nhận Vercel, có thể cấu hình:

```env
NITRO_PRESET=vercel
```

Chi tiết xem:

```text
DEPLOY_VERCEL.md
```

Sau khi thêm hoặc thay đổi biến môi trường trên Vercel, cần redeploy ứng dụng.

---

## Player HLS

Lạc Việt Cinema sử dụng `hls.js` trên các trình duyệt hỗ trợ Media Source Extensions.

Luồng xử lý cơ bản:

```text
Chọn phim
   │
   ▼
Chọn nguồn API
   │
   ▼
Lấy server + tập phim
   │
   ├── Có HLS ──► HLS.js ──► Phát video
   │                 │
   │                 └── Lỗi nghiêm trọng
   │                         │
   │                         ▼
   │                    Embed fallback
   │
   └── Không có HLS ──► Embed
```

Các nguồn có HLS hiện tại:

```text
KKPhim
OPhim
VSMov
```

NguonC được sử dụng theo chế độ phát phù hợp với dữ liệu mà nguồn cung cấp.

---

## Routing

Dự án sử dụng **file-based routing** của TanStack Router.

Ví dụ:

```text
src/routes/index.tsx
→ /

src/routes/search.tsx
→ /search

src/routes/movie.$slug.tsx
→ /movie/:slug

src/routes/watch.$slug.tsx
→ /watch/:slug

src/routes/party.$code.tsx
→ /party/:code
```

Không chỉnh sửa thủ công:

```text
src/routeTree.gen.ts
```

File này được tạo tự động bởi TanStack Router.

---

## Đóng góp

Nếu muốn đóng góp cho dự án:

```bash
git checkout -b feature/ten-tinh-nang
```

Sau khi hoàn thành:

```bash
git add .
git commit -m "feat: thêm tính năng mới"
git push origin feature/ten-tinh-nang
```

Sau đó tạo Pull Request về nhánh `main`.

Nên đảm bảo trước khi gửi PR:

```bash
npm run lint
npm run build
```

---

## Lưu ý về nguồn nội dung

Lạc Việt Cinema sử dụng dữ liệu và đường dẫn phát từ các API bên thứ ba.

Dự án không kiểm soát tính ổn định, thời gian hoạt động, nội dung hoặc chính sách của các nguồn API đó. Một nguồn có thể thay đổi endpoint, giới hạn truy cập hoặc ngừng hoạt động bất kỳ lúc nào.

Người triển khai dự án có trách nhiệm đảm bảo việc sử dụng dữ liệu và nội dung phù hợp với pháp luật, điều khoản của nhà cung cấp và quyền sở hữu trí tuệ tại khu vực của mình.

---

## Trạng thái dự án

Dự án đang được phát triển và có thể tiếp tục thay đổi về:

* Giao diện
* API
* Database schema
* Player
* Authentication
* Hệ thống tài khoản
* Watch Party
* Bảng xếp hạng
* Hệ thống đề xuất phim

Các thay đổi mới nên được theo dõi trực tiếp qua lịch sử commit của repository.

---

## Giấy phép

Repository hiện chưa công bố giấy phép mã nguồn riêng.

Nếu có nhu cầu sử dụng, phân phối hoặc phát triển lại mã nguồn cho mục đích khác, vui lòng kiểm tra giấy phép mới nhất của repository hoặc liên hệ chủ dự án.

---

<div align="center">

### Lạc Việt Cinema

**Mở phim, chạm hồn Việt.**

Code bởi **Nam NpT**

</div>
