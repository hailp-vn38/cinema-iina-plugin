# New Structure Implementation Checklist

## Mục tiêu

Tài liệu này là checklist triển khai thực tế để chuyển plugin hiện tại sang cấu trúc mới:

- UI dùng React
- webview tự fetch dữ liệu qua provider
- runtime IINA chỉ xử lý bridge và playback
- kiến trúc sẵn sàng cho nhiều nguồn API phim

Tài liệu này dùng để thực thi, không phải tài liệu ý tưởng.

## Đầu ra cuối cùng

Khi hoàn thành checklist này, project phải có:

- cấu trúc thư mục mới rõ ràng
- React app chạy được trong IINA sidebar
- runtime mỏng, không chứa source-specific logic
- provider `ophim` chạy ổn
- playback hoạt động qua bridge runtime
- có build/package flow ổn định

## Giai đoạn 0: Chuẩn bị nền

### Việc cần làm

1. xác nhận `old_plugin/` đã chứa đầy đủ mã legacy
2. giữ lại ở root các tài liệu:
   - `MULTI_SOURCE_ARCHITECTURE.md`
   - `REACT_REFACTOR_PLAN.md`
3. tạo khung thư mục mới:
   - `src/runtime`
   - `src/shared`
   - `ui/src`
   - `scripts`
   - `docs`
4. tạo `.gitignore` phù hợp cho:
   - `node_modules`
   - `dist`
   - build artifacts

### Definition of done

- root không còn lẫn code legacy
- cấu trúc mới đã tồn tại
- project sẵn sàng để cài React/Vite

## Giai đoạn 1: Khởi tạo toolchain

### Việc cần làm

1. tạo `package.json`
2. cài các dependency tối thiểu:
   - `react`
   - `react-dom`
   - `vite`
3. cài dev dependency:
   - `@vitejs/plugin-react`
4. thêm script cơ bản:
   - `dev`
   - `build:ui`
   - `package`
5. tạo `vite.config.js` hoặc `vite.config.mjs`
6. cấu hình output build ra thư mục phù hợp để đóng gói plugin

### Output mong đợi

- chạy được `npm install`
- chạy được `npm run build:ui`

### Definition of done

- React build ra file tĩnh thành công
- không cần dùng lại `ui/app.js` cũ

## Giai đoạn 2: Tạo cấu trúc shared contract

### Việc cần làm

1. tạo `src/shared/contracts/commands.js`
2. tạo `src/shared/contracts/events.js`
3. tạo `src/shared/contracts/models.js`
4. tạo `src/shared/constants.js`
5. gom tất cả message names vào contract chung

### Danh sách command tối thiểu

- `ui_init`
- `play_episode`
- `play_all`
- `request_diagnostic`

### Danh sách event tối thiểu

- `app_state`
- `app_play_result`
- `app_playback_state`
- `app_diagnostic`

### Definition of done

- UI và runtime dùng cùng một bộ tên message
- không còn hardcode message rải rác

## Giai đoạn 3: Dựng runtime mỏng

### Việc cần làm

1. tạo `src/runtime/index.js`
2. tạo `src/runtime/bridge/registerMessages.js`
3. tạo `src/runtime/services/playbackService.js`
4. tạo `src/runtime/services/playbackStateService.js`
5. tạo `src/runtime/services/sidebarSyncService.js`
6. tạo `src/runtime/services/diagnosticService.js`
7. tạo `src/runtime/utils/deferred.js`
8. chuyển toàn bộ playback logic sang `playbackService`

### Runtime chỉ nên xử lý

- open current media
- append playlist
- set current media title
- sync playback state
- diagnostic

### Runtime không nên xử lý

- home fetch
- search fetch
- category fetch
- detail fetch
- source-specific normalization

### Definition of done

- runtime chạy được mà không phụ thuộc OPhim
- `src/runtime/index.js` ngắn và rõ ràng

## Giai đoạn 4: Dựng React shell

### Việc cần làm

1. tạo `ui/src/main.jsx`
2. tạo `ui/src/App.jsx`
3. tạo `ui/src/bridge/iinaClient.js`
4. tạo `ui/src/bridge/runtimeEvents.js`
5. tạo `ui/src/store/appStore.js`
6. tạo component cơ bản:
   - `Header`
   - `StatusPanel`
   - `SourceSelector`
   - `DiagnosticPanel`
7. mount React vào `ui/index.html`

### Mục tiêu giai đoạn này

- React shell render được trong IINA sidebar
- nút ping/runtime diagnostic vẫn hoạt động

### Definition of done

- React UI hiện được trong IINA
- nhận được `app_diagnostic` từ runtime

## Giai đoạn 5: Tạo provider system

### Việc cần làm

1. tạo `ui/src/providers/baseProvider.js`
2. tạo `ui/src/providers/registry.js`
3. tạo `ui/src/providers/ophim/`
   - `index.js`
   - `api.js`
   - `mapper.js`
   - `constants.js`
4. định nghĩa provider interface chuẩn

### Provider interface tối thiểu

- `getHome()`
- `getCategory(slug)`
- `search(keyword)`
- `getDetail(slug)`
- `toPlaybackPayload(detail, options)`

### Definition of done

- provider `ophim` hoạt động độc lập
- có thể thêm provider mới mà không đụng runtime

## Giai đoạn 6: Chuyển catalog sang React

### Việc cần làm

1. tạo `catalogStore`
2. tạo `useCatalogActions`
3. render `CategoryChips`
4. render `MovieList`
5. tạo `MovieCard`
6. load home/category/search bằng provider

### Rule

- mọi fetch catalog phải đi qua provider
- UI component không fetch trực tiếp

### Definition of done

- home load được
- category load được
- search load được

## Giai đoạn 7: Chuyển detail sang React

### Việc cần làm

1. tạo `detailStore`
2. tạo `useDetailActions`
3. render `DetailHero`
4. render `ServerSelector`
5. render `EpisodeList`
6. xử lý back từ detail về catalog
7. chuẩn hóa detail model

### Detail model bắt buộc có

- movie info
- server list
- active server
- entries
- sourceId
- detailSlug

### Definition of done

- mở detail được từ catalog
- đổi server được
- đổi server làm danh sách tập đổi đúng

## Giai đoạn 8: Chuyển playback sang command fully resolved

### Việc cần làm

1. UI tự resolve `entries` từ provider detail
2. tạo command `play_episode`
3. tạo command `play_all`
4. gửi payload đầy đủ sang runtime
5. runtime chỉ dùng `entries` được gửi từ UI

### Payload tối thiểu cho playback

- `requestId`
- `sourceId`
- `movieId`
- `detailSlug`
- `title`
- `serverId`
- `episodeIndex`
- `episodeName`
- `entries`

### Definition of done

- runtime không còn gọi API detail để resolve source
- play single và play all đều chạy được

## Giai đoạn 9: Đồng bộ playback state

### Việc cần làm

1. runtime phát `app_playback_state`
2. UI tạo `playbackStore`
3. map `playback_state` vào detail view
4. highlight tập đang phát
5. hiển thị `Đang xem`
6. đảm bảo play single không highlight sai episode index

### Definition of done

- detail biết tập nào đang phát
- playlist position đổi thì UI phản ánh đúng

## Giai đoạn 10: Xử lý ảnh và fallback chuẩn

### Việc cần làm

1. tạo helper image chung trong UI
2. normalize CDN path theo từng provider
3. thêm fallback ảnh ở catalog
4. thêm fallback ảnh ở detail

### Definition of done

- ảnh hiển thị ổn định
- khi ảnh lỗi, UI không vỡ layout

## Giai đoạn 11: Source selector

### Việc cần làm

1. tạo `sourceStore`
2. render source selector trong header hoặc panel riêng
3. đổi source thì reset catalog/detail state hợp lý
4. load lại home theo source mới

### Definition of done

- có thể chuyển source trong UI
- app không cần reload toàn plugin

## Giai đoạn 12: Build và package

### Việc cần làm

1. tạo `scripts/build-ui.mjs`
2. tạo `scripts/package-plugin.mjs`
3. build UI ra thư mục package
4. copy runtime vào artifact package
5. zip thành `.iinaplgz`

### Script tối thiểu nên có

- `npm run build:ui`
- `npm run package`
- `npm run release:local`

### Definition of done

- không cần zip tay
- package luôn lấy đúng build mới nhất

## Giai đoạn 13: Tài liệu hóa

### Việc cần làm

1. tạo `docs/architecture.md`
2. tạo `docs/provider-guide.md`
3. tạo `docs/bridge-contract.md`
4. tạo `docs/troubleshooting.md`
5. tạo `docs/release.md`

### Nội dung tối thiểu phải có

- cách thêm provider mới
- cách debug bridge
- cách debug playback
- cách package plugin

### Definition of done

- người khác có thể tiếp tục phát triển mà không cần đọc hết lịch sử chat

## Thứ tự triển khai khuyến nghị

Thực hiện theo đúng thứ tự sau:

1. Giai đoạn 0
2. Giai đoạn 1
3. Giai đoạn 2
4. Giai đoạn 3
5. Giai đoạn 4
6. Giai đoạn 5
7. Giai đoạn 6
8. Giai đoạn 7
9. Giai đoạn 8
10. Giai đoạn 9
11. Giai đoạn 10
12. Giai đoạn 11
13. Giai đoạn 12
14. Giai đoạn 13

Không nên:

- thêm source thứ 2 trước khi `ophim` ổn định
- rewrite cả runtime và UI cùng lúc mà không có phase
- để UI mới phụ thuộc logic legacy trong `old_plugin/`

## Checklist nhanh theo milestone

### Milestone A: Foundation

- [ ] root sạch, legacy nằm trong `old_plugin/`
- [ ] có `package.json`
- [ ] có Vite + React build được
- [ ] có shared contracts

### Milestone B: Runtime stable

- [ ] runtime chỉ còn playback + bridge
- [ ] không còn source fetch trong runtime
- [ ] diagnostic vẫn hoạt động

### Milestone C: UI React running

- [ ] React render trong IINA sidebar
- [ ] source selector hiện được
- [ ] status + diagnostic hiện được

### Milestone D: OPhim provider complete

- [ ] home
- [ ] category
- [ ] search
- [ ] detail
- [ ] server selector
- [ ] episode list

### Milestone E: Playback integrated

- [ ] play episode
- [ ] play all
- [ ] sync playback state
- [ ] highlight current episode

### Milestone F: Release ready

- [ ] package script ổn
- [ ] docs đủ
- [ ] có thể thêm source mới mà không sửa runtime

## Việc nên làm ngay sau tài liệu này

1. tạo `package.json`
2. scaffold thư mục mới
3. dựng runtime playback-only
4. dựng React shell
5. chuyển OPhim thành provider đầu tiên
