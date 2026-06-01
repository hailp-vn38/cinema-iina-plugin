import { DEFAULT_PROVIDER_ENDPOINTS } from "@shared/constants";
import { getProviderConfig } from "../../config/providerConfig";

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

export interface KkphimMovieRaw {
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
}

export interface KkphimServerEpisodeRaw {
  name?: string;
  slug?: string;
  link_m3u8?: string;
}

export interface KkphimServerRaw {
  server_name?: string;
  server_data?: KkphimServerEpisodeRaw[];
}

export interface KkphimHomePayloadRaw {
  items?: KkphimMovieRaw[];
  pagination?: {
    totalItems?: number;
    totalItemsPerPage?: number;
    currentPage?: number;
    totalPages?: number;
  };
}

export interface KkphimListPayloadRaw {
  data?: {
    titlePage?: string;
    items?: KkphimMovieRaw[];
    params?: {
      pagination?: {
        totalItems?: number;
        totalItemsPerPage?: number;
        currentPage?: number;
        totalPages?: number;
      };
    };
    APP_DOMAIN_CDN_IMAGE?: string;
  };
}

export interface KkphimDetailPayloadRaw {
  movie?: KkphimMovieRaw;
  episodes?: KkphimServerRaw[];
}

export const kkphimApi = {
  getHome(page = 1) {
    const apiBase =
      getProviderConfig().kkphimApiBase || DEFAULT_PROVIDER_ENDPOINTS.kkphimApiBase;
    return fetchJson<KkphimHomePayloadRaw>(
      apiBase +
        "/danh-sach/phim-moi-cap-nhat?page=" +
        encodeURIComponent(page),
    );
  },
  getCategory(slug: string, page = 1) {
    const apiBase =
      getProviderConfig().kkphimApiBase || DEFAULT_PROVIDER_ENDPOINTS.kkphimApiBase;
    return fetchJson<KkphimListPayloadRaw>(
      apiBase +
        "/v1/api/danh-sach/" +
        encodeURIComponent(slug) +
        "?page=" +
        encodeURIComponent(page),
    );
  },
  search(keyword: string, page = 1) {
    const apiBase =
      getProviderConfig().kkphimApiBase || DEFAULT_PROVIDER_ENDPOINTS.kkphimApiBase;
    return fetchJson<KkphimListPayloadRaw>(
      apiBase +
        "/v1/api/tim-kiem?keyword=" +
        encodeURIComponent(keyword) +
        "&page=" +
        encodeURIComponent(page),
    );
  },
  getDetail(slug: string) {
    const apiBase =
      getProviderConfig().kkphimApiBase || DEFAULT_PROVIDER_ENDPOINTS.kkphimApiBase;
    return fetchJson<KkphimDetailPayloadRaw>(
      apiBase + "/phim/" + encodeURIComponent(slug),
    );
  },
};
