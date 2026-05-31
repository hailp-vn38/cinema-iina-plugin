# Provider Development

Tài liệu này dành cho người muốn thêm một nguồn phim mới vào plugin.

## Nguyên tắc

- Provider chạy trong webview React, không chạy trong runtime IINA.
- Provider chịu trách nhiệm:
  - fetch home/category/search/detail
  - normalize dữ liệu về model chung
  - build playback payload để runtime dùng ngay
- Runtime không nên chứa logic riêng của từng source.

## Contract tối thiểu

Một provider phải export object từ `createBaseProvider(...)` với các field:

```js
{
  id: "source-id",
  label: "Source Label",
  categories: [{ slug, label }],
  supports: {
    home: true,
    search: true,
    categories: true,
    servers: true,
  },
  getHome(page?),
  getCategory(slug, page?),
  search(keyword, page?),
  getDetail(slug),
  toPlaybackPayload(detail, options),
}
```

Base factory nằm ở [ui/src/providers/baseProvider.js](../ui/src/providers/baseProvider.js).

## Cấu trúc provider

Nên tạo theo pattern này:

```text
ui/src/providers/<source>/
  constants.js
  api.js
  mapper.js
  index.js
```

## Bước 1: constants

Khai báo:

- base URL
- categories mặc định
- bất kỳ giá trị cố định nào của source

Ví dụ:

```js
export const EXAMPLE_API_BASE = "https://example.com";

export const EXAMPLE_CATEGORIES = [
  { slug: "phim-bo", label: "Bộ" },
  { slug: "phim-le", label: "Lẻ" },
];
```

## Bước 2: api

Tạo wrapper fetch mỏng, chỉ lo gọi endpoint và trả JSON.

Ví dụ:

```js
async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  return response.json();
}
```

Provider hiện có để tham chiếu:

- [ui/src/providers/ophim/api.js](../ui/src/providers/ophim/api.js)
- [ui/src/providers/kkphim/api.js](../ui/src/providers/kkphim/api.js)

## Bước 3: mapper

Đây là phần quan trọng nhất. Mọi source cần map về shape chung.

### Catalog item chung

```js
{
  sourceId,
  id,
  slug,
  name,
  originName,
  posterUrl,
  year,
  quality,
  lang,
  episodeCurrent,
  type,
}
```

### Detail chung

```js
{
  sourceId,
  movieId,
  slug,
  title,
  originName,
  posterUrl,
  content,
  quality,
  lang,
  year,
  time,
  episodeCurrent,
  serverName,
  activeServerIndex,
  servers,
  entries,
}
```

### Server chung

```js
{
  id,
  index,
  name,
  entries,
}
```

### Entry chung

```js
{
  name,
  slug,
  url,
}
```

### Mapper cần có

- `mapHomePayload(payload)`
- `mapCategoryPayload(slug, payload)`
- `mapSearchPayload(keyword, payload)`
- `mapDetailPayload(slug, payload)`

### Lưu ý khi map detail

- Chỉ giữ các episode có `link_m3u8`
- Nên chọn default server theo ưu tiên `vietsub`, nếu không có thì lấy server đầu
- Normalize ảnh về URL tuyệt đối
- Strip HTML trong `content` nếu source trả rich text

## Bước 4: index

File `index.js` sẽ ghép `api + mapper + toPlaybackPayload`.

### `toPlaybackPayload`

Provider phải trả payload runtime dùng trực tiếp.

#### Single episode

```js
{
  sourceId,
  movieId,
  detailSlug,
  title,
  serverId,
  episodeIndex,
  episodeName,
  entries,
}
```

#### Play all

```js
{
  sourceId,
  movieId,
  detailSlug,
  title,
  serverId,
  startEpisodeIndex,
  entries,
}
```

Runtime contracts tham chiếu:

- [src/shared/contracts/commands.js](../src/shared/contracts/commands.js)
- [src/shared/contracts/models.js](../src/shared/contracts/models.js)

## Bước 5: đăng ký provider

Thêm provider vào [ui/src/providers/registry.js](../ui/src/providers/registry.js):

```js
import { exampleProvider } from "./example/index.js";

const providers = {
  ophim: ophimProvider,
  kkphim: kkphimProvider,
  example: exampleProvider,
};
```

## Bước 6: bật source trong UI

Source selector lấy từ `DEFAULT_SOURCES` trong [ui/src/store/appStore.js](../ui/src/store/appStore.js).

Thêm item mới:

```js
{ id: "example", label: "Example", enabled: true }
```

## Kỳ vọng runtime

Runtime không fetch source phim.

Runtime chỉ làm các việc này:

- nhận `play_episode`
- nhận `play_all`
- gọi `mpv.command("loadfile", ...)`
- sync state về UI

Runtime entry:

- [src/runtime/index.js](../src/runtime/index.js)
- [src/runtime/services/playbackService.js](../src/runtime/services/playbackService.js)

## Checklist khi thêm provider

1. Tạo `constants.js`
2. Tạo `api.js`
3. Tạo `mapper.js`
4. Tạo `index.js`
5. Đăng ký vào `registry.js`
6. Thêm source vào `DEFAULT_SOURCES`
7. Test:
   - home
   - category
   - search
   - detail
   - chọn server
   - play một tập
   - play all
   - history restore

## Cách tự test nhanh

Ví dụ với node:

```bash
node -e 'import { kkphimProvider } from "./ui/src/providers/kkphim/index.js"; const home=await kkphimProvider.getHome(); const item=home.items[0]; const detail=await kkphimProvider.getDetail(item.slug); console.log(home.items.length, detail.title, detail.entries.length);'
```

## Gợi ý kỹ thuật

- Nếu source có CORS không ổn định, test trong chính webview IINA thay vì chỉ test bằng browser thường
- Nếu source có nhiều server, đừng assume server đầu luôn đúng
- Nếu detail trả cả `embed` và `m3u8`, ưu tiên `m3u8`
- Không để React component fetch API trực tiếp; để fetch trong provider

## Tham chiếu provider hiện có

- OPhim:
  - [ui/src/providers/ophim/index.js](../ui/src/providers/ophim/index.js)
  - [ui/src/providers/ophim/mapper.js](../ui/src/providers/ophim/mapper.js)
- KKPhim:
  - [ui/src/providers/kkphim/index.js](../ui/src/providers/kkphim/index.js)
  - [ui/src/providers/kkphim/mapper.js](../ui/src/providers/kkphim/mapper.js)
