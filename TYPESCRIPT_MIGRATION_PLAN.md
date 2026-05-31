# TypeScript Migration Plan

Tài liệu này mô tả các bước cần làm để chuyển project từ JavaScript sang TypeScript theo cách an toàn, ít phá vỡ flow hiện tại.

## Mục tiêu

- Đưa toàn bộ UI React, provider layer, shared contracts và runtime IINA sang TypeScript.
- Không đổi kiến trúc hiện tại:
  - webview React tự fetch dữ liệu source
  - runtime IINA chỉ lo playback bridge
- Giảm rủi ro bằng cách migrate theo phase nhỏ.

## Nguyên tắc

- Không convert toàn repo trong một lần.
- Shared contracts phải đi trước để làm nền type.
- Provider layer đi trước runtime.
- Ban đầu không bật `strict` quá sớm.
- Ưu tiên compile pass trước, sau đó mới siết type.

## Trạng thái hiện tại

- UI: React + Zustand + Vite
- Runtime: JS bundle bằng `esbuild`
- Providers:
  - `ophim`
  - `kkphim`
- Shared contracts:
  - `src/shared/contracts/*`
- Runtime phụ thuộc global `iina`, `mpv`, `sidebar`, `event`

## Phase 0: Chuẩn bị

### Việc cần làm

1. Cài TypeScript tooling
```bash
npm install -D typescript @types/react @types/react-dom
```

2. Tạo `tsconfig.json`

Khuyến nghị ban đầu:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": false,
    "noEmit": true,
    "allowJs": false,
    "checkJs": false,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src", "ui/src"]
}
```

3. Thêm script typecheck vào `package.json`

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

### Definition of Done

- `typescript` được cài
- có `tsconfig.json`
- chạy được `npm run typecheck`

## Phase 1: Chuyển Shared Contracts

### Mục tiêu

Chuyển các contract dùng chung sang TypeScript để tạo nền type cho UI và runtime.

### File cần chuyển

- `src/shared/constants.js`
- `src/shared/contracts/commands.js`
- `src/shared/contracts/events.js`
- `src/shared/contracts/models.js`

### Việc cần làm

1. Đổi `.js` -> `.ts`
2. Tạo type/interface thật thay vì chỉ giữ object shape mô tả
3. Xuất type dùng lại cho UI và runtime

### Types nên có

- `UiCommandName`
- `RuntimeEventName`
- `CatalogItem`
- `ProviderEntry`
- `ProviderServer`
- `ProviderDetail`
- `PlayEpisodeCommand`
- `PlayAllCommand`
- `AppStatePayload`
- `AppPlayResultPayload`
- `AppPlaybackStatePayload`
- `AppDiagnosticPayload`

### Definition of Done

- toàn bộ `src/shared` compile pass
- UI và runtime import lại được từ file `.ts`

## Phase 2: Chuyển Provider Base và Provider Types

### Mục tiêu

Tạo type chuẩn cho provider abstraction.

### File cần thêm/chuyển

- `ui/src/providers/baseProvider.js` -> `baseProvider.ts`
- thêm `ui/src/providers/types.ts`

### Việc cần làm

1. Khai báo interface cho provider
2. Khai báo type cho:
   - category option
   - home/category/search payload
   - detail payload
   - playback payload
3. Type hóa `createBaseProvider`

### Provider interface gợi ý

```ts
interface SourceProvider {
  id: string;
  label: string;
  categories: ProviderCategory[];
  supports: {
    home: boolean;
    search: boolean;
    categories: boolean;
    servers: boolean;
  };
  getHome(page?: number): Promise<CatalogPayload>;
  getCategory(slug: string, page?: number): Promise<CatalogPayload>;
  search(keyword: string, page?: number): Promise<CatalogPayload>;
  getDetail(slug: string): Promise<ProviderDetail>;
  toPlaybackPayload(
    detail: ProviderDetail,
    options: PlaybackPayloadOptions
  ): PlayEpisodeCommand | PlayAllCommand;
}
```

### Definition of Done

- có `providers/types.ts`
- `baseProvider.ts` compile pass
- registry có thể dùng lại type provider

## Phase 3: Chuyển Providers Cụ Thể

### Mục tiêu

Chuyển `ophim` và `kkphim` sang TypeScript.

### File cần chuyển

- `ui/src/providers/ophim/*`
- `ui/src/providers/kkphim/*`
- `ui/src/providers/registry.js`

### Việc cần làm

1. Đổi `.js` -> `.ts`
2. Type hóa response API ở mức đủ dùng
3. Type hóa mapper output
4. Đảm bảo `toPlaybackPayload` trả đúng union type

### Lưu ý

- Không cần type toàn bộ raw API JSON ngay.
- Chỉ type các field đang thực sự dùng.
- Có thể dùng type nội bộ như:
  - `OphimMovieSummary`
  - `KkphimMovieDetail`
  - `EpisodeServerRaw`

### Definition of Done

- `ophim` compile pass
- `kkphim` compile pass
- registry compile pass
- test logic home/detail bằng script node vẫn chạy

## Phase 4: Chuyển Store và Hooks

### Mục tiêu

Type hóa state của app để giảm lỗi UI logic.

### File cần chuyển

- `ui/src/store/appStore.js`
- `ui/src/hooks/*.js`

### Việc cần làm

1. Định nghĩa `AppStoreState`
2. Định nghĩa actions của store
3. Type hóa payload của hooks:
   - `useCatalogActions`
   - `useDetailActions`
   - `useHistoryActions`
   - `useRuntimeBridge`
   - `useSourceProvider`

### Điểm cần chú ý

- `history` và `playback` state phải có type rõ
- `detail.data` nên là `ProviderDetail | null`
- các callback `onOpenDetail`, `onRestoreHistory` phải có type cụ thể

### Definition of Done

- `appStore.ts` compile pass
- hooks compile pass
- không còn `implicit any` ở hook signatures

## Phase 5: Chuyển Components React Sang TSX

### Mục tiêu

Type hóa props và event handlers cho components.

### File cần chuyển

- `ui/src/App.jsx`
- `ui/src/components/**/*.jsx`

### Việc cần làm

1. Đổi `.jsx` -> `.tsx`
2. Tạo prop types/interface cho từng component
3. Type hóa event handlers (`MouseEvent`, `KeyboardEvent`, `FormEvent`)

### Components ưu tiên

1. `App.tsx`
2. `Header.tsx`
3. `CatalogView.tsx`
4. `DetailView.tsx`
5. `Dropdown.tsx`
6. `DiagnosticPanel.tsx` nếu còn dùng lại sau này

### Definition of Done

- UI compile pass với `.tsx`
- không còn props không rõ type ở components chính

## Phase 6: Chuyển Runtime IINA Sang TS

### Mục tiêu

Type hóa runtime nhưng không làm chậm flow hiện tại.

### File cần chuyển

- `src/runtime/**/*.js`

### Việc cần làm

1. Đổi runtime files sang `.ts`
2. Tạo declaration cho global `iina`
3. Type hóa các service payload quan trọng

### Cần thêm file

- `src/types/iina-plugin.d.ts`

Ban đầu có thể khai báo đơn giản:

```ts
declare const iina: any;
```

Sau đó mới siết dần cho:

- `sidebar`
- `mpv`
- `core`
- `event`

### Definition of Done

- runtime compile pass bằng `esbuild`
- không phá packaging hiện tại

## Phase 7: Siết Type

### Mục tiêu

Sau khi mọi thứ đã chạy ổn bằng TS, bắt đầu tăng độ chặt.

### Việc cần làm

1. bật `strict: true`
2. xử lý `null/undefined`
3. giảm `any`
4. thêm type guards nếu cần cho raw API

### Tuỳ chọn tiếp theo

- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noImplicitOverride`

### Definition of Done

- `npm run typecheck` pass với `strict: true`
- không còn `any` ở phần core domain quan trọng

## Thứ tự commit khuyến nghị

1. `chore: add typescript scaffold`
2. `refactor: convert shared contracts to typescript`
3. `refactor: add provider types and convert provider base`
4. `refactor: convert ophim and kkphim providers to typescript`
5. `refactor: convert app store and hooks to typescript`
6. `refactor: convert react components to tsx`
7. `refactor: convert runtime to typescript`
8. `chore: enable strict type checking`

## Rủi ro kỹ thuật

- import path `.js` cũ còn sót sau khi đổi file extension
- runtime IINA dùng global API không có typings
- Vite alias `@shared/*` cần khớp cả trong TS config
- build script hiện tại cần tương thích với `.ts/.tsx`
- provider raw JSON có shape không ổn định theo source

## Checklist hoàn thành

- [ ] Cài `typescript` và typings React
- [ ] Tạo `tsconfig.json`
- [ ] Thêm `npm run typecheck`
- [ ] Chuyển `src/shared`
- [ ] Chuyển `ui/src/providers/baseProvider`
- [ ] Chuyển `ophim`
- [ ] Chuyển `kkphim`
- [ ] Chuyển `registry`
- [ ] Chuyển Zustand store
- [ ] Chuyển hooks
- [ ] Chuyển React components sang `.tsx`
- [ ] Chuyển runtime sang `.ts`
- [ ] Thêm `iina-plugin.d.ts`
- [ ] Build UI pass
- [ ] Build runtime pass
- [ ] Package pass
- [ ] Bật `strict`

## Kết quả mong muốn

Khi hoàn tất migration:

- thêm provider mới nhanh hơn
- đổi payload giữa UI/runtime ít lỗi hơn
- refactor UI/detail/history an toàn hơn
- playback flow và history restore dễ bảo trì hơn
