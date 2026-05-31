# Cinema Sources

Plugin IINA dùng React webview để duyệt nhiều nguồn phim và dùng runtime IINA chỉ để điều khiển playback.

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

Registry nằm ở [ui/src/providers/registry.js](ui/src/providers/registry.js).

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
- Plugin package: `dist/releases/iina-plugin-next.iinaplgz`

## Entry points quan trọng

- Runtime entry: [src/runtime/index.js](src/runtime/index.js)
- UI entry: [ui/index.html](ui/index.html)
- React app: [ui/src/App.jsx](ui/src/App.jsx)
- Shared commands: [src/shared/contracts/commands.js](src/shared/contracts/commands.js)
- Shared events: [src/shared/contracts/events.js](src/shared/contracts/events.js)

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

