import type { ProviderCategory } from "@shared/contracts/models";

export const OPHIM_API_BASE = "https://ophim1.com/v1/api";

export const OPHIM_CATEGORIES: ProviderCategory[] = [
  { slug: "phim-moi", label: "Mới" },
  { slug: "phim-bo", label: "Bộ" },
  { slug: "phim-le", label: "Lẻ" },
  { slug: "tv-shows", label: "TV" },
];
