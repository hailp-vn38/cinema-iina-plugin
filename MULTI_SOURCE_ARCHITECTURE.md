# Multi-Source IINA Plugin Architecture

## Mục tiêu mới

Thiết kế lại plugin để hỗ trợ nhiều nguồn API phim khác nhau, trong khi giữ runtime IINA mỏng, ổn định và ít rủi ro crash.

Định hướng cốt lõi:

- webview React chịu trách nhiệm `fetch` dữ liệu phim
- runtime IINA chỉ nhận thao tác với app
- thêm nguồn mới bằng provider adapter, không phải sửa playback runtime
- playback, bridge và sync state phải là lõi ổn định dùng chung cho mọi nguồn

## Nguyên tắc kiến trúc

### 1. Webview là application layer

Webview React sẽ:

- gọi API của các nguồn phim
- quản lý catalog, detail, server, episode
- chuẩn hóa dữ liệu nguồn về model nội bộ
- quyết định payload cần gửi sang IINA runtime

Webview không nên:

- gọi trực tiếp API playback của IINA ngoài message bridge
- chứa logic mpv
- dựa vào shape thô của từng API trong component UI

### 2. Runtime IINA là playback layer

Runtime chỉ làm các việc sau:

- nhận command từ webview
- gọi `mpv.command(...)`
- set title hiện tại
- sync playback state
- trả trạng thái về webview
- log, diagnostic, error

Runtime không nên:

- fetch OPhim, KKPhim, hay các nguồn phim khác trong flow mặc định
- biết business logic của từng source
- render hay giữ nhiều UI state

### 3. Provider là đơn vị mở rộng chính

Mỗi nguồn API là một provider độc lập.

Provider phải implement cùng một interface:

- `search`
- `getHome`
- `getCategory`
- `getDetail`
- `normalizePlayPayload`

Khi muốn thêm source mới:

- tạo provider mới
- đăng ký vào provider registry
- không chạm vào playback runtime

## Kiến trúc tổng thể

```text
React Webview
  -> provider registry
  -> source adapters
  -> app store
  -> IINA bridge client

IINA Runtime
  -> message bus
  -> playback service
  -> state sync service
  -> diagnostic service
```

## Luồng dữ liệu chính

### Luồng dữ liệu UI

1. user chọn source
2. React app gọi provider tương ứng
3. provider fetch API nguồn phim
4. provider normalize dữ liệu
5. React store cập nhật catalog/detail/server/episode
6. user bấm play
7. webview gửi command playback sang runtime

### Luồng playback

1. webview gửi `play_episode` hoặc `play_all`
2. runtime validate payload
3. runtime gọi `mpv.command("loadfile", ...)`
4. runtime sync title/playback state
5. runtime gửi `playback_state` và `play_result` về webview

## Cấu trúc thư mục đề xuất

```text
.
├── Info.json
├── pref.html
├── src
│   ├── runtime
│   │   ├── index.js
│   │   ├── bridge
│   │   │   ├── registerMessages.js
│   │   │   ├── runtimeBus.js
│   │   │   └── runtimeCommands.js
│   │   ├── services
│   │   │   ├── playbackService.js
│   │   │   ├── playbackStateService.js
│   │   │   ├── sidebarSyncService.js
│   │   │   └── diagnosticService.js
│   │   ├── state
│   │   │   ├── playbackStore.js
│   │   │   └── runtimeStore.js
│   │   └── utils
│   │       ├── logger.js
│   │       └── deferred.js
│   └── shared
│       ├── contracts
│       │   ├── commands.js
│       │   ├── events.js
│       │   ├── models.js
│       │   └── providers.js
│       └── constants.js
├── ui
│   ├── index.html
│   ├── src
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── bridge
│   │   │   ├── iinaClient.js
│   │   │   └── runtimeEvents.js
│   │   ├── providers
│   │   │   ├── registry.js
│   │   │   ├── baseProvider.js
│   │   │   ├── ophim
│   │   │   │   ├── index.js
│   │   │   │   ├── api.js
│   │   │   │   ├── mapper.js
│   │   │   │   └── constants.js
│   │   │   ├── kkphim
│   │   │   │   ├── index.js
│   │   │   │   ├── api.js
│   │   │   │   ├── mapper.js
│   │   │   │   └── constants.js
│   │   │   └── local
│   │   │       └── mockProvider.js
│   │   ├── features
│   │   │   ├── source-selector
│   │   │   ├── catalog
│   │   │   ├── detail
│   │   │   ├── playback
│   │   │   └── diagnostic
│   │   ├── store
│   │   │   ├── appStore.js
│   │   │   ├── sourceStore.js
│   │   │   ├── catalogStore.js
│   │   │   ├── detailStore.js
│   │   │   └── playbackStore.js
│   │   ├── hooks
│   │   │   ├── useSourceProvider.js
│   │   │   ├── useCatalogActions.js
│   │   │   ├── useDetailActions.js
│   │   │   └── usePlaybackActions.js
│   │   ├── components
│   │   │   ├── layout
│   │   │   ├── source
│   │   │   ├── catalog
│   │   │   ├── detail
│   │   │   ├── playback
│   │   │   └── diagnostic
│   │   ├── utils
│   │   │   ├── image.js
│   │   │   ├── sanitize.js
│   │   │   └── format.js
│   │   └── styles
│   │       ├── tokens.css
│   │       ├── globals.css
│   │       └── app.css
├── scripts
│   ├── build-ui.mjs
│   ├── package-plugin.mjs
│   └── dev-package.mjs
└── docs
    ├── architecture.md
    ├── provider-guide.md
    ├── bridge-contract.md
    ├── release.md
    └── troubleshooting.md
```

## Ranh giới trách nhiệm

### React webview chịu trách nhiệm

- chọn source đang dùng
- load home/category/search/detail
- chọn server
- chọn episode
- chuẩn hóa ảnh, metadata, label, content
- quản lý cache tạm của từng provider
- gửi playback command tối giản sang runtime

### Runtime IINA chịu trách nhiệm

- `play_episode`
- `play_all`
- `append_playlist`
- `set_current_title`
- `sync_current_playback_state`
- `diagnostic`

## Contract giữa webview và runtime

### Command từ webview sang runtime

```js
play_episode
{
  requestId: string,
  sourceId: string,
  movieId: string,
  detailSlug: string,
  title: string,
  serverId: string,
  episodeIndex: number,
  episodeName: string,
  entries: Array<{ name: string, url: string }>
}
```

```js
play_all
{
  requestId: string,
  sourceId: string,
  movieId: string,
  detailSlug: string,
  title: string,
  serverId: string,
  startEpisodeIndex: number,
  entries: Array<{ name: string, url: string }>
}
```

```js
request_diagnostic
{
  requestId: string
}
```

### Event từ runtime về webview

```js
app_state
{
  status: string,
  message: string
}
```

```js
app_play_result
{
  requestId: string,
  ok: boolean,
  mode: "single" | "playlist",
  count?: number,
  error?: string
}
```

```js
app_playback_state
{
  active: boolean,
  sourceId: string,
  movieId: string,
  detailSlug: string,
  title: string,
  episodeName: string,
  episodeIndex: number,
  serverId: string,
  url: string
}
```

```js
app_diagnostic
{
  pluginVersion: string,
  sidebarLoaded: boolean,
  windowLoaded: boolean,
  lastUiMessage: string,
  lastAppMessage: string,
  lastError: string
}
```

## Model chuẩn hóa trong UI

### Source descriptor

```js
{
  id: "ophim",
  label: "OPhim",
  enabled: true
}
```

### Catalog item

```js
{
  sourceId: "ophim",
  id: "movie-id",
  slug: "movie-slug",
  name: "Movie Name",
  originName: "Original Name",
  posterUrl: "https://...",
  year: "2025",
  quality: "HD",
  lang: "Vietsub",
  episodeCurrent: "Tap 8"
}
```

### Detail model

```js
{
  sourceId: "ophim",
  id: "movie-id",
  slug: "movie-slug",
  title: "Movie Name",
  originName: "Original Name",
  posterUrl: "https://...",
  content: "Summary",
  quality: "HD",
  lang: "Vietsub",
  year: "2025",
  time: "45 phut",
  servers: [
    {
      id: "vietsub-1",
      name: "Vietsub #1",
      entries: [
        { index: 0, name: "1", slug: "1", url: "https://..." }
      ]
    }
  ],
  activeServerId: "vietsub-1"
}
```

## Provider interface

Mỗi provider phải export cùng một interface:

```js
export const provider = {
  id: "ophim",
  label: "OPhim",
  supports: {
    home: true,
    search: true,
    categories: true,
    servers: true
  },
  getHome,
  getCategory,
  search,
  getDetail,
  toPlaybackPayload
}
```

### Yêu cầu bắt buộc cho provider

- không render UI
- không thao tác IINA runtime
- chỉ fetch và normalize data
- mọi output phải về model chung

## Provider registry

Tạo một registry tập trung:

```js
const providers = {
  ophim,
  kkphim,
  mock
}
```

Dùng registry để:

- liệt kê source cho UI
- lookup provider theo `sourceId`
- tắt/mở source

## Thiết kế state React

Tách state theo slice:

### `sourceStore`

- `sources`
- `activeSourceId`
- `setActiveSource`

### `catalogStore`

- `view`
- `catalogTitle`
- `catalogSubtitle`
- `items`
- `activeCategory`
- `keyword`

### `detailStore`

- `detail`
- `activeServerId`
- `setActiveServer`

### `playbackStore`

- `active`
- `title`
- `episodeName`
- `episodeIndex`
- `detailSlug`
- `sourceId`

### `systemStore`

- `connected`
- `status`
- `message`
- `error`
- `diagnostic`

## Màn hình UI đề xuất

### 1. Source selector

Hiển thị source đang dùng:

- OPhim
- KKPhim
- Mock

Đây là lớp quan trọng nhất để plugin trở thành multi-source thật sự.

### 2. Catalog view

- search
- category
- movie cards

### 3. Detail view

- movie info
- source label
- server selector
- episode list
- `play all`
- trạng thái đang phát

### 4. Diagnostic view

Giữ riêng một panel debug, không trộn với business UI.

## Chiến lược chọn source

### Cách đơn giản

Nguồn đang chọn là global cho toàn app.

Ưu điểm:

- dễ hiểu
- đơn giản để triển khai

Nhược điểm:

- không trộn nhiều source trong cùng một catalog session

### Cách nâng cao

Cho phép mỗi tab logic có source riêng.

Hiện tại không cần thiết.

Khuyến nghị:

- dùng global active source trước

## Về image loading

Không nên để mỗi component tự đoán URL ảnh.

Phải có một helper chung:

- `normalizeImageBase`
- `absoluteImageUrl`
- fallback image

Mỗi provider có thể override logic image nếu source khác cấu trúc OPhim.

## Playback strategy

### Quy tắc

- runtime chỉ nhận URL đã resolve
- runtime không gọi API detail để resolve source nữa
- webview gửi đầy đủ `entries`

### Lợi ích

- runtime độc lập với source
- provider nào cũng phát được nếu trả đúng entries
- dễ debug vì payload play đã fully resolved

## Sync trạng thái đang xem

Runtime cần gửi:

- `sourceId`
- `movieId`
- `detailSlug`
- `serverId`
- `episodeIndex`
- `episodeName`

Webview dùng dữ liệu này để:

- highlight tập đang phát
- hiển thị `Dang xem`
- nếu sidebar reload, có thể tìm lại detail tương ứng

## Caching strategy

Caching nên nằm ở UI/provider layer.

### Cache nên có

- home cache theo source
- category cache theo `sourceId + category`
- detail cache theo `sourceId + slug`

### Không nên cache ở runtime

Runtime không nên giữ cache data phim dài hạn.

## Error handling strategy

### Provider error

Ví dụ:

- source chết
- CORS fail
- JSON invalid
- data shape đổi

Xử lý tại UI:

- gắn source name vào error
- cho retry
- không ảnh hưởng runtime

### Runtime error

Ví dụ:

- loadfile fail
- mpv state không sync
- sidebar bridge lỗi

Xử lý tại runtime:

- log error
- gửi `app_play_result` hoặc `app_state`
- cập nhật diagnostic

## Build pipeline đề xuất

### Dev

1. Vite build React UI
2. copy artifact vào `ui/dist`
3. package plugin

### Release

1. run lint
2. run build
3. run package
4. generate `.iinaplgz`

## Lộ trình triển khai

### Phase 1: tách runtime khỏi source logic

Mục tiêu:

- loại bỏ toàn bộ fetch nguồn phim ra khỏi runtime

Việc làm:

1. xóa `ophim` HTTP logic khỏi runtime
2. giữ runtime chỉ còn bridge, playback, sync
3. chuẩn hóa `play_episode` và `play_all`

### Phase 2: dựng React shell

Mục tiêu:

- thay UI imperative bằng React

Việc làm:

1. tạo React app
2. tạo store
3. tạo bridge client
4. render catalog cứng trước

### Phase 3: provider system

Mục tiêu:

- hỗ trợ nhiều source

Việc làm:

1. tạo `baseProvider`
2. implement `ophim`
3. tạo `registry`
4. thêm source selector

### Phase 4: detail + server + episode

Mục tiêu:

- thay flow detail hiện tại

Việc làm:

1. render detail từ provider
2. render server list
3. render episode list
4. gửi payload play fully resolved

### Phase 5: playback sync

Mục tiêu:

- detail phản ánh đúng tập đang phát

Việc làm:

1. chuẩn hóa runtime playback state
2. map playback state về detail React
3. highlight episode hiện tại

### Phase 6: thêm source mới

Mục tiêu:

- chứng minh kiến trúc mở rộng được

Việc làm:

1. thêm provider thứ 2
2. không sửa playback runtime
3. chỉ sửa registry và UI source selector

## Migration path từ code hiện tại

### Bước 1

Giữ runtime hiện tại nhưng bỏ phần:

- home fetch
- category fetch
- search fetch
- detail fetch

khỏi `src/index.js`.

### Bước 2

Chuyển các helper normalize movie/detail/server sang `ui/providers/ophim/mapper.js`.

### Bước 3

Chuyển play payload hiện tại sang dạng fully resolved:

- `title`
- `detailSlug`
- `sourceId`
- `serverId`
- `entries`
- `episodeIndex`
- `playMode`

### Bước 4

Sau khi UI gửi payload đầy đủ, runtime không cần biết source là OPhim hay KKPhim nữa.

## Tài liệu cần có

### `docs/provider-guide.md`

Mô tả:

- cách tạo provider mới
- required interface
- image normalization
- detail normalization
- playback payload generation

### `docs/bridge-contract.md`

Mô tả:

- command list
- event list
- payload schema
- backward compatibility rule

### `docs/architecture.md`

Mô tả:

- runtime layer
- webview layer
- provider layer
- state flow

## Nhận xét kiến trúc

Ưu điểm:

- thêm source mới rất nhanh
- runtime đơn giản hơn, ít crash hơn
- dễ debug vì fetch và normalize tách khỏi playback
- React UI dễ mở rộng hơn UI imperative hiện tại

Nhược điểm:

- webview phải gánh nhiều logic hơn
- cần quản lý CORS/source reliability tốt
- bắt buộc phải có contract chặt nếu không sẽ nhanh rối

Kết luận:

Đây là hướng đúng nếu mục tiêu là plugin xem phim đa nguồn, mở rộng lâu dài và giảm rủi ro mỗi lần sửa playback.

## Các bước nên làm tiếp ngay

1. tạo `package.json` với React + Vite
2. tạo React shell trong `ui/src`
3. tách runtime hiện tại thành playback runtime thuần
4. tạo provider đầu tiên `ophim`
5. chuyển toàn bộ fetch dữ liệu phim sang `ui/providers/ophim`
6. định nghĩa contract `play_episode` và `play_all`
7. chỉ sau khi provider `ophim` chạy ổn mới thêm source thứ 2
