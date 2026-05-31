# IINA Plugin React Refactor Plan

## Mục tiêu

Tái cấu trúc plugin theo hướng dễ mở rộng, dễ debug, dễ nâng cấp và giảm rủi ro khi sửa lỗi.

Mục tiêu chính:

- tách rõ `plugin runtime` và `webview UI`
- chuyển UI hiện tại sang React
- chuẩn hóa luồng dữ liệu, event, playback state và error handling
- có build pipeline rõ ràng cho dev, package và release
- tạo nền tảng để thêm feature mới mà không làm vỡ runtime đang phát

## Kết quả mong muốn

Sau khi hoàn thành refactor:

- mã nguồn có cấu trúc rõ theo domain thay vì dồn vào vài file lớn
- UI React có state management rõ ràng, dễ thêm màn mới
- runtime IINA chỉ giữ phần bridge, playback, HTTP và state sync
- mọi message giữa UI và runtime đều có schema và type rõ ràng
- build ra plugin package `.iinaplgz` ổn định và lặp lại được

## Kiến trúc đề xuất

Tách thành 2 lớp chính:

1. `runtime`
   Chạy trong môi trường IINA plugin.
   Nhiệm vụ:
   - nhận message từ webview
   - gọi API OPhim
   - điều khiển mpv/IINA
   - đồng bộ playback state
   - log, error handling, diagnostic

2. `ui`
   Chạy trong sidebar webview.
   Nhiệm vụ:
   - render catalog/detail/player state
   - quản lý tương tác người dùng
   - gửi command sang runtime
   - nhận state update từ runtime

## Cấu trúc thư mục đề xuất

```text
.
├── Info.json
├── pref.html
├── api.md
├── src
│   ├── runtime
│   │   ├── index.js
│   │   ├── bridge
│   │   │   ├── messageBus.js
│   │   │   ├── messageTypes.js
│   │   │   └── posters.js
│   │   ├── services
│   │   │   ├── ophimApi.js
│   │   │   ├── playbackService.js
│   │   │   ├── sidebarService.js
│   │   │   └── diagnosticService.js
│   │   ├── controllers
│   │   │   ├── catalogController.js
│   │   │   ├── detailController.js
│   │   │   └── playbackController.js
│   │   ├── state
│   │   │   ├── runtimeStore.js
│   │   │   └── playbackStore.js
│   │   └── utils
│   │       ├── image.js
│   │       ├── logger.js
│   │       └── normalize.js
│   └── shared
│       ├── contracts
│       │   ├── messages.js
│       │   ├── catalog.js
│       │   ├── detail.js
│       │   └── playback.js
│       └── constants.js
├── ui
│   ├── index.html
│   ├── src
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── bridge
│   │   │   ├── iinaClient.js
│   │   │   └── useRuntimeBridge.js
│   │   ├── components
│   │   │   ├── layout
│   │   │   ├── catalog
│   │   │   ├── detail
│   │   │   ├── player
│   │   │   └── diagnostic
│   │   ├── features
│   │   │   ├── catalog
│   │   │   ├── detail
│   │   │   ├── playback
│   │   │   └── diagnostic
│   │   ├── store
│   │   │   ├── appStore.js
│   │   │   └── selectors.js
│   │   ├── hooks
│   │   │   ├── useCatalog.js
│   │   │   ├── useDetail.js
│   │   │   └── usePlaybackState.js
│   │   ├── styles
│   │   │   ├── globals.css
│   │   │   ├── tokens.css
│   │   │   └── components.css
│   │   └── utils
│   │       ├── format.js
│   │       └── sanitize.js
├── scripts
│   ├── build-ui.mjs
│   ├── package-plugin.mjs
│   └── dev-watch.mjs
├── dist
│   ├── ui
│   └── plugin
└── docs
    ├── architecture.md
    ├── messaging.md
    ├── release.md
    └── troubleshooting.md
```

## Nguyên tắc kiến trúc

### 1. Runtime càng mỏng càng tốt

`src/runtime/index.js` chỉ nên:

- khởi tạo plugin
- đăng ký event IINA
- đăng ký bridge message
- gọi controller tương ứng

Không nên để logic business dài trong file entry.

### 2. UI không tự gọi OPhim API

UI React chỉ gửi command sang runtime.

Lý do:

- tránh lệch contract giữa UI và runtime
- dễ log và debug toàn bộ luồng
- runtime kiểm soát tốt hơn playback state
- dễ cache hoặc retry sau này

### 3. Shared contract bắt buộc dùng chung

Tạo một lớp shared contract cho:

- message name
- payload shape
- response shape
- playback state shape

Nếu có thể, nên chuyển toàn repo sang TypeScript ở bước sau để contract có type thực.

### 4. Playback chỉ có một service duy nhất

Mọi lệnh liên quan:

- play single episode
- play all
- append playlist
- sync title hiện tại
- sync episode hiện tại

đều đi qua `playbackService`.

Không gọi `mpv.command(...)` rải rác ở nhiều chỗ.

## Stack đề xuất

### UI

- React
- Vite
- Zustand hoặc React Context + reducer
- CSS module hoặc CSS tách lớp rõ ràng

Khuyến nghị:

- dùng React + Zustand cho state app
- giữ CSS thuần trước, chưa cần Tailwind

### Runtime

- JavaScript thuần trước
- chia module theo service/controller

### Build

- Vite build UI vào `ui/dist`
- script package copy runtime + UI build output vào thư mục đóng gói
- zip thành `.iinaplgz`

## Luồng dữ liệu đề xuất

### Từ UI sang runtime

Message command:

- `ui_init`
- `ui_search`
- `ui_load_category`
- `ui_open_detail`
- `ui_select_server`
- `ui_play_episode`
- `ui_play_all`
- `ui_request_diagnostic`

### Từ runtime sang UI

State/event:

- `app_state`
- `catalog_data`
- `detail_data`
- `playback_state`
- `catalog_error`
- `app_play_ack`
- `app_play_result`
- `app_diagnostic`

### Rule

- UI chỉ gửi command
- runtime chỉ gửi state hoặc result
- không để một message vừa là command vừa là data dump

## Thiết kế state trong UI React

### App state tối thiểu

- `view`
  - `catalog`
  - `detail`
- `catalog`
  - items
  - activeCategory
  - keyword
  - title
  - subtitle
- `detail`
  - movie info
  - servers
  - activeServerIndex
  - episodes
- `playback`
  - active
  - title
  - episodeName
  - episodeIndex
  - detailSlug
- `system`
  - status
  - message
  - error
  - connected
  - diagnostic

### UI component tree đề xuất

```text
App
├── Header
├── SearchPanel
├── StatusPanel
├── ContentRouter
│   ├── CatalogView
│   │   ├── CategoryChips
│   │   └── MovieList
│   └── DetailView
│       ├── DetailHero
│       ├── ServerSelector
│       ├── EpisodeList
│       └── PlaybackSummary
└── DiagnosticPanel
```

## Lộ trình thực hiện

### Phase 1: Ổn định cấu trúc hiện tại

Mục tiêu:

- không thêm feature mới
- chỉ tách file và gom logic hiện có

Việc cần làm:

1. tách `src/index.js` thành:
   - `runtime/index.js`
   - `services/ophimApi.js`
   - `services/playbackService.js`
   - `services/sidebarService.js`
   - `controllers/*.js`
2. tách helper ảnh, normalize data, diagnostic
3. gom message names vào `shared/contracts/messages.js`

Definition of done:

- behavior không đổi
- runtime file entry ngắn gọn
- dễ tìm chỗ sửa theo domain

### Phase 2: Thiết lập React UI song song

Mục tiêu:

- dựng React mà chưa phá UI cũ

Việc cần làm:

1. thêm Vite vào repo
2. tạo `ui/src/main.jsx`, `App.jsx`
3. build React ra file tĩnh
4. giữ `ui/index.html` chỉ còn mount point + script build
5. viết `iinaClient` bọc `postMessage` và `onMessage`

Definition of done:

- React render được trong IINA sidebar
- diagnostic bridge vẫn hoạt động

### Phase 3: Migrating feature từng phần

Mục tiêu:

- chuyển UI hiện tại sang React mà không rewrite ồ ạt

Thứ tự:

1. Header + status
2. Catalog list
3. Detail view
4. Server selector
5. Episode list
6. Diagnostic panel

Definition of done:

- không còn phụ thuộc `ui/app.js` imperative
- toàn bộ render do React quản lý

### Phase 4: Chuẩn hóa playback flow

Mục tiêu:

- playback logic ổn định, testable, dễ debug

Việc cần làm:

1. tách `playSingleEpisode`
2. tách `playAllEpisodes`
3. tách `syncPlaybackState`
4. chuẩn hóa `force-media-title`
5. chuẩn hóa mapping `playlist-pos -> original episode index`

Definition of done:

- chọn tập và play all chạy qua cùng một service
- playback state phản ánh đúng trên detail

### Phase 5: Build, package, release

Mục tiêu:

- build và đóng gói 1 lệnh

Việc cần làm:

1. `npm run build:ui`
2. `npm run package`
3. tạo script tự bump version nếu cần
4. tạo release checklist

Definition of done:

- không cần zip tay
- package output nhất quán

## Kế hoạch file-by-file cho lần triển khai đầu

### Bước 1

Tạo `package.json` với:

- `vite`
- `react`
- `react-dom`
- `zustand`

### Bước 2

Tạo:

- `ui/src/main.jsx`
- `ui/src/App.jsx`
- `ui/src/bridge/iinaClient.js`
- `ui/src/store/appStore.js`

### Bước 3

Tạo:

- `src/runtime/services/ophimApi.js`
- `src/runtime/services/playbackService.js`
- `src/runtime/controllers/detailController.js`
- `src/runtime/controllers/playbackController.js`

### Bước 4

Di chuyển constants và message names vào:

- `src/shared/contracts/messages.js`
- `src/shared/constants.js`

### Bước 5

Giữ tương thích tạm thời:

- React UI dùng đúng message cũ trong giai đoạn chuyển tiếp
- runtime không đổi contract quá sớm

## Chiến lược migration an toàn

Không rewrite toàn bộ trong một bước.

Nên làm theo thứ tự:

1. tách runtime trước
2. dựng React shell
3. migrate catalog
4. migrate detail
5. migrate playback indicators
6. bỏ UI cũ

Lý do:

- nếu có crash, biết lỗi nằm ở runtime hay UI
- không mất khả năng rollback

## Test plan

### Runtime

Kiểm tra thủ công:

- load home
- search
- mở detail
- đổi server
- play tập lẻ
- play all
- đổi playlist position
- reopen sidebar

### UI

Kiểm tra:

- render catalog
- render detail
- đổi server không mất state
- highlight tập đang phát đúng
- back từ detail về catalog đúng snapshot

### Regression

Đặc biệt cần test lại:

- crash khi click play
- webview bridge handshake
- remote image loading
- đồng bộ playback state sau khi mpv chuyển tập

## Rủi ro kỹ thuật

### 1. IINA runtime không thân thiện với async callback trực tiếp

Biện pháp:

- tiếp tục dùng deferred execution trong bridge runtime

### 2. React build output có thể làm sai relative path

Biện pháp:

- cấu hình Vite base là relative
- test trực tiếp trong sidebar

### 3. mpv playlist position không phản ánh original episode index

Biện pháp:

- giữ mapping riêng trong playback service

### 4. HTML content từ API detail

Biện pháp:

- sanitize hoặc render plain text trước

## Tài liệu nên có thêm

Tạo thêm các file:

- `docs/architecture.md`
  mô tả runtime, UI, bridge
- `docs/messaging.md`
  định nghĩa tất cả messages
- `docs/troubleshooting.md`
  các lỗi thường gặp như crash, không load image, mất bridge
- `docs/release.md`
  cách build và package

## Đề xuất thứ tự triển khai thực tế

Tuần 1:

- tách runtime module
- chuẩn hóa contract/message
- thêm scripts build/package

Tuần 2:

- dựng React shell
- migrate catalog + detail

Tuần 3:

- migrate playback state + server selector
- cleanup UI cũ

Tuần 4:

- test regression
- viết docs
- chốt release

## Tiêu chí hoàn thành refactor

Refactor được coi là hoàn thành khi:

- UI chạy hoàn toàn bằng React
- runtime không còn file lớn kiểu monolith
- playback service là điểm vào duy nhất cho media actions
- server selector, detail, playback state hoạt động ổn định
- build/package được tự động hóa
- có tài liệu đủ để người khác tiếp tục phát triển

## Bước tiếp theo nên làm ngay

1. tạo `package.json` và thiết lập Vite + React
2. tách `src/index.js` hiện tại thành runtime modules
3. dựng React shell tối thiểu với `Header`, `StatusPanel`, `CatalogView`
4. giữ nguyên contract hiện tại trong giai đoạn đầu để không vỡ plugin
5. sau khi React render ổn định mới migrate detail và playback
