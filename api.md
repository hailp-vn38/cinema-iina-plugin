## Home
1. home https://ophim1.com/v1/api/home
```
{
  "status": "success",
  "message": "Lấy dữ liệu thành công",
  "data": {
    "seoOnPage": {
      "titleHead": "Xem phim online miễn phí",
      "descriptionHead": "Xem phim online chất lượng cao miễn phí"
    },
    "items": [
      {
        "_id": "66f8e123456789abcdef",
        "name": "Tên phim",
        "slug": "ten-phim",
        "origin_name": "Original Name",
        "alternative_names": ["Tên khác 1", "Tên khác 2"],
        "type": "series",
        "thumb_url": "https://example.com/thumb.jpg",
        "poster_url": "https://example.com/poster.jpg",
        "year": 2024,
        "category": [
          {
            "id": "action",
            "name": "Hành động",
            "slug": "hanh-dong"
          }
        ],
        "country": [
          {
            "id": "us",
            "name": "Mỹ",
            "slug": "my"
          }
        ]
      }
    ],
    "params": {
      "pagination": {
        "currentPage": 1,
        "totalItems": 100,
        "totalItemsPerPage": 24
      }
    },
    "APP_DOMAIN_CDN_IMAGE": "https://img.ophim.cc/uploads/movies/",
    "APP_DOMAIN_FRONTEND": "https://ophim1.com"
  }
}
```
2. https://ophim1.com/v1/api/danh-sach/[slug]
slug : string[phim-moi | phim-bo | phim-le | tv-shows | hoat-hinh | phim-vietsub | phim-thuyet-minh | phim-long-tien | phim-bo-dang-chieu | phim-bo-hoan-thanh | phim-sap-chieu | subteam | phim-chieu-rap]
Slug của danh sách phim cụ thể

```
{
  "status": "success",
  "message": "Lấy dữ liệu thành công",
  "data": {
    "seoOnPage": {
      "titleHead": "Danh sách phim mới",
      "descriptionHead": "Xem phim mới nhất được cập nhật"
    },
    "titlePage": "Phim mới",
    "breadCrumb": [
      {
        "name": "Trang chủ",
        "slug": "",
        "isCurrent": false
      },
      {
        "name": "Phim mới",
        "isCurrent": true
      }
    ],
    "items": [...],
    "params": {
      "pagination": {
        "currentPage": 1,
        "totalItems": 100,
        "totalItemsPerPage": 24,
        "totalPages": 5
      }
    }
  }
}
```

ví dụ :

```GET /v1/api/danh-sach/phim-moi?page=1&limit=24```

## Detail
url : /v1/api/phim/[slug]
```
{
  "status": "success",
  "message": "Lấy dữ liệu thành công",
  "data": {
    "item": {
      "_id": "66f8e123456789abcdef",
      "name": "Trò Chơi Con Mực",
      "slug": "tro-choi-con-muc",
      "origin_name": "Trò Chơi Con Mực",
      "alternative_names": ["Trò Chơi Con Mực", "Trò Chơi Con Mực 2"],
      "content": "Mô tả nội dung phim...",
      "type": "single",
      "status": "completed",
      "thumb_url": "/thumb.jpg",
      "poster_url": "/poster.jpg",
      "trailer_url": "https://youtube.com/watch?v=xyz",
      "time": "181 phút",
      "episode_current": "Full",
      "episode_total": "1",
      "quality": "HD",
      "lang": "Vietsub",
      "lang_key": ["vs", "tm"],
      "year": 2019,
      "view": 1000000,
      "actor": ["Robert Downey Jr.", "Chris Evans"],
      "director": ["Anthony Russo", "Joe Russo"],
      "category": [...],
      "country": [...],
      "episodes": [
        {
          "server_name": "VIP",
          "is_ai": false,
          "server_data": [
            {
              "name": "Full",
              "slug": "full",
              "filename": "tro-choi-con-muc-full",
              "link_embed": "https://player.example.com/embed/xyz",
              "link_m3u8": "https://example.com/video.m3u8"
            }
          ]
        }
      ],
      "tmdb": {
        "type": "movie",
        "id": "299534",
        "vote_average": 8.4,
        "vote_count": 20000
      },
      "imdb": {
        "id": "tt4154796",
        "vote_average": 8.4,
        "vote_count": 1000000
      }
    },
    "seoOnPage": {...},
    "breadCrumb": [...]
  }
}
```

## Toc dùng api của detail
## Chap dùng link_m3u8 trong api detail

## genre
url : /v1/api/the-loai
```json
{
  "status": "success",
  "data": [
    { "_id": "...", "slug": "hanh-dong", "name": "Hành động" },
    { "_id": "...", "slug": "tinh-cam", "name": "Tình cảm" }
  ]
}

```

## Search

url : '/v1/api/tim-kiem?keyword=[keyword]'
```json
{
  "status": "success",
  "message": "Tìm kiếm thành công",
  "data": {
    "seoOnPage": {
      "titleHead": "Tìm kiếm: avengers",
      "descriptionHead": "Kết quả tìm kiếm cho từ khóa 'avengers'"
    },
    "titlePage": "Tìm kiếm: avengers",
    "breadCrumb": [
      {
        "name": "Trang chủ",
        "slug": "",
        "isCurrent": false
      },
      {
        "name": "Tìm kiếm",
        "isCurrent": true
      }
    ],
    "items": [...],
    "params": {
      "keyword": "avengers",
      "pagination": {
        "currentPage": 1,
        "totalItems": 15,
        "totalItemsPerPage": 20,
        "totalPages": 1
      }
    }
  }
}

```