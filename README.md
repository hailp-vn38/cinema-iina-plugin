# Cinema Sources

Plugin IINA dùng React webview để duyệt nhiều nguồn phim và dùng runtime IINA chỉ để điều khiển playback.

<p align="center">
  <img src="image/CleanShot 2026-06-01 at 10.43.59@2x.png" alt="Preferences" width="32%" />
  <img src="image/CleanShot 2026-06-01 at 10.43.36@2x.png" alt="Cinema Sidebar" width="32%" />
  <img src="image/CleanShot 2026-06-01 at 10.43.05@2x.png" alt="Plugin Install" width="32%" />
</p>

## Cài plugin vào IINA

1. Build package:

```bash
npm run package
```

2. Mở IINA.
3. Vào `IINA -> Settings -> Plugins`.
4. Chọn `Install Plugin...`.
5. Chọn file:

```text
dist/releases/Cinema Sources.iinaplgz
```

6. Cài xong, đóng và mở lại IINA.

Yêu cầu: phải reload IINA sau khi cài plugin để runtime và sidebar được nạp đúng bản mới.

## Sử dụng trong IINA

1. Mở lại IINA sau khi cài plugin.
2. Mở một cửa sổ player.
3. Mở sidebar `Cinema`.
4. Chọn provider `OPhim` hoặc `KKPhim`.
5. Dùng search hoặc category để mở detail phim.
6. Trong detail:
   - bấm một tập để phát tập đó
   - bấm `Play all` để mở tập đầu và thêm toàn bộ tập vào playlist
7. Tab `Lịch sử` là màn mặc định, dùng để:
   - mở lại detail của phim đã xem
   - restore playlist đã lưu

## Cấu hình endpoint provider

1. Vào `IINA -> Settings -> Plugins`.
2. Chọn plugin `Cinema Sources`.
3. Mở tab `Preferences`.
4. Cập nhật:
   - `OPhim API Base`
   - `KKPhim API Base`
5. Đóng Settings và mở lại sidebar `Cinema`.

Khuyến nghị: sau khi đổi endpoint, reload IINA nếu bạn muốn chắc chắn runtime và webview đang dùng cấu hình mới ngay từ đầu.

## Mục tiêu

- UI và business logic của source chạy trong webview.
- Runtime IINA chỉ nhận command từ UI và gọi `mpv`.
- Mỗi nguồn phim là một provider độc lập, có thể thêm/xóa mà không phải sửa nhiều runtime.

## Kiến trúc

- `ui/`
  - React app chạy trong sidebar của IINA.
  - Tự `fetch` catalog/detail/search từ provider.
  - Gửi command playback sang runtime qua `iina.postMessage(...)`.
- `src/runtime/`
  - Runtime plugin của IINA.
  - Nhận command như `play_episode`, `play_all`.
  - Gọi `mpv.command(...)`, sync playback state, trả event về UI.
- `src/shared/`
  - Contracts dùng chung giữa UI và runtime.

## Cấu trúc thư mục

```text
src/
  runtime/
    bridge/
    services/
    state/
    utils/
  shared/
    contracts/

ui/
  src/
    bridge/
    components/
    hooks/
    lib/
    providers/
      ophim/
      kkphim/
    store/

scripts/
  build-ui-inline.mjs
  build-runtime.mjs
  package-plugin.mjs
```

## Provider hiện có

- `ophim`
- `kkphim`

Registry nằm ở [ui/src/providers/registry.ts](ui/src/providers/registry.ts).

## Cài đặt

```bash
npm install
```

## Lệnh phát triển

```bash
npm run build:ui
npm run build:runtime
npm run package
```

`npm run package` sẽ build UI, build runtime và tạo file `.iinaplgz` trong `dist/releases/`.

## Build output

- UI inline: `dist/ui/index.html`
- Runtime bundle: `dist/runtime/index.js`
- Plugin package: `dist/releases/Cinema Sources.iinaplgz`

## Entry points quan trọng

- Runtime entry: [src/runtime/index.ts](src/runtime/index.ts)
- UI entry: [ui/index.html](ui/index.html)
- React app: [ui/src/App.tsx](ui/src/App.tsx)
- Shared commands: [src/shared/contracts/commands.ts](src/shared/contracts/commands.ts)
- Shared events: [src/shared/contracts/events.ts](src/shared/contracts/events.ts)

## Playback flow

1. User thao tác trong UI.
2. Provider resolve detail, server và `entries`.
3. UI gửi `play_episode` hoặc `play_all`.
4. Runtime nhận command và gọi `mpv.command("loadfile", ...)`.
5. Runtime sync `app_state` và `app_playback_state` về UI.

## History flow

- History được lưu ở webview `localStorage`.
- Mỗi history entry lưu đủ metadata để restore playlist:
  - `sourceId`
  - `detailSlug`
  - `serverId`
  - `entries`
  - `episodeIndex`
- Restore playlist giữ đúng thứ tự tập, sau đó nhảy đến tập đang xem.

## Tài liệu thêm provider

Xem [docs/PROVIDER_DEVELOPMENT.md](docs/PROVIDER_DEVELOPMENT.md).
