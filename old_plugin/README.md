# Old Plugin Snapshot

Thư mục này chứa toàn bộ implementation legacy của plugin trước khi chuyển sang kiến trúc mới:

- runtime/plugin code cũ
- webview UI cũ
- manifest và preference page cũ
- tài liệu implementation cũ
- các gói `.iinaplgz` đã build

Mục đích:

- giữ reference để đối chiếu khi migrate
- tránh trộn code legacy với cấu trúc mới
- cho phép chuyển dần feature sang kiến trúc React multi-source

## Nội dung

- `src/`
  runtime cũ của plugin
- `ui/`
  webview UI cũ
- `Info.json`
  manifest plugin cũ
- `pref.html`
  trang preference cũ
- `api.md`
  ghi chú API cũ
- `IMPLEMENTATION_PLAN.md`
  kế hoạch implementation giai đoạn cũ
- `releases/`
  các file `.iinaplgz` đã build

## Lưu ý

Không nên phát triển tiếp trên code trong thư mục này.

Code mới nên được tạo ở cấu trúc mới tại root project theo tài liệu:

- `MULTI_SOURCE_ARCHITECTURE.md`
- `REACT_REFACTOR_PLAN.md`
