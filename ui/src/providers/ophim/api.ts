import { OPHIM_API_BASE } from "./constants";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("HTTP " + response.status);
  }

  return response.json() as Promise<T>;
}

export interface OphimMovieRaw {
  _id?: string;
  slug?: string;
  name?: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  year?: string | number;
  quality?: string;
  lang?: string;
  episode_current?: string;
  type?: string;
  content?: string;
  time?: string;
  episodes?: OphimServerRaw[];
}

export interface OphimServerEpisodeRaw {
  name?: string;
  slug?: string;
  link_m3u8?: string;
}

export interface OphimServerRaw {
  server_name?: string;
  server_data?: OphimServerEpisodeRaw[];
}

export interface OphimHomePayloadRaw {
  data?: {
    items?: OphimMovieRaw[];
    APP_DOMAIN_CDN_IMAGE?: string;
  };
}

export interface OphimCategoryPayloadRaw extends OphimHomePayloadRaw {
  pagination?: {
    currentPage?: number;
    totalPage?: number;
    totalItems?: number;
  };
  data?: {
    titlePage?: string;
    items?: OphimMovieRaw[];
    APP_DOMAIN_CDN_IMAGE?: string;
  };
}

export interface OphimDetailPayloadRaw {
  data?: {
    item?: OphimMovieRaw;
    APP_DOMAIN_CDN_IMAGE?: string;
  };
}

export const ophimApi = {
  getHome() {
    return fetchJson<OphimHomePayloadRaw>(OPHIM_API_BASE + "/home");
  },
  getCategory(slug: string, page = 1) {
    return fetchJson<OphimCategoryPayloadRaw>(
      OPHIM_API_BASE +
        "/danh-sach/" +
        encodeURIComponent(slug) +
        "?page=" +
        page +
        "&limit=24",
    );
  },
  search(keyword: string) {
    return fetchJson<OphimHomePayloadRaw>(
      OPHIM_API_BASE + "/tim-kiem?keyword=" + encodeURIComponent(keyword),
    );
  },
  getDetail(slug: string) {
    return fetchJson<OphimDetailPayloadRaw>(
      OPHIM_API_BASE + "/phim/" + encodeURIComponent(slug),
    );
  },
};
