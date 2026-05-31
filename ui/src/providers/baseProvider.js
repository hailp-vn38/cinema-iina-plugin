export function createBaseProvider(definition) {
  return {
    id: definition.id,
    label: definition.label,
    supports: Object.assign(
      {
        home: false,
        search: false,
        categories: false,
        servers: false,
      },
      definition.supports || {}
    ),
    getHome: definition.getHome,
    getCategory: definition.getCategory,
    search: definition.search,
    getDetail: definition.getDetail,
    toPlaybackPayload: definition.toPlaybackPayload,
  };
}
