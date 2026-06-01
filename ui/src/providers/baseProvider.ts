import type {
  SourceProvider,
  SourceProviderDefinition,
} from "./types";

export function createBaseProvider(
  definition: SourceProviderDefinition,
): SourceProvider {
  return {
    id: definition.id,
    label: definition.label,
    categories: Array.isArray(definition.categories)
      ? definition.categories.slice()
      : [],
    supports: Object.assign(
      {
        home: false,
        search: false,
        categories: false,
        servers: false,
      },
      definition.supports || {},
    ),
    getHome: definition.getHome,
    getCategory: definition.getCategory,
    search: definition.search,
    getDetail: definition.getDetail,
    toPlaybackPayload: definition.toPlaybackPayload,
  };
}
