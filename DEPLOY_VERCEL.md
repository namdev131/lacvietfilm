# Deploy lên Vercel

## 1. Biến môi trường (Vercel → Settings → Environment Variables)

Bắt buộc cho đăng nhập / đăng ký:

```
VITE_SUPABASE_URL=https://emowxegcupqhhoyitxel.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Oy5v_tZ2Y5HGBT6CY_jo0A_1lGYF4kA
VITE_SUPABASE_PROJECT_ID=emowxegcupqhhoyitxel
SUPABASE_URL=https://emowxegcupqhhoyitxel.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_Oy5v_tZ2Y5HGBT6CY_jo0A_1lGYF4kA
SUPABASE_PROJECT_ID=emowxegcupqhhoyitxel
SITE_URL=https://lacvietfilm.vercel.app
DATABASE_URL=<đặt bằng PostgreSQL connection string trong Vercel; không commit>
```

Đặt cho cả 3 môi trường: Production, Preview, Development. Sau khi thêm phải **Redeploy**.

> Các key trên là publishable (công khai) nên an toàn khi để ở client.
> Service role key không khả dụng trên Lovable Cloud — các tính năng cần quyền admin
> sẽ không chạy trên Vercel, nhưng đăng nhập/đăng ký/dữ liệu người dùng vẫn hoạt động
> bình thường qua RLS.

## 2. Build settings

- Framework Preset: **Other** (hoặc để Vercel tự nhận)
- Build Command: `npm run build`
- Output: để trống (Nitro tự xuất `.vercel/output`)

Nitro tự nhận diện Vercel qua biến `VERCEL=1`. Nếu không, thêm env:

```
NITRO_PRESET=vercel
```

## 3. Cho phép domain Vercel trong Auth

Domain Vercel `lacvietfilm.vercel.app` phải được thêm vào danh sách
**Redirect URLs** của backend, nếu không email xác minh / magic link / Google
sẽ quay về sai địa chỉ. Cần thêm:

```
https://lacvietfilm.vercel.app
https://lacvietfilm.vercel.app/**
```

## 4. Đăng nhập Google

- Trên domain Lovable: dùng OAuth broker của Lovable (đã có sẵn).
- Trên Vercel: tự động chuyển sang OAuth gốc của Supabase (`src/lib/oauth.ts`).
  Cần cấu hình Google Client ID/Secret trong backend và thêm
  `https://emowxegcupqhhoyitxel.supabase.co/auth/v1/callback` vào Authorized
  redirect URIs của Google Cloud Console.

Email/mật khẩu và Magic link chạy được ngay sau bước 1–3.
