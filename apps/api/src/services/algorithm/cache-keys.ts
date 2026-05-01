/**
 * All cache key builders for algorithms in one place.
 * Changing a key format here automatically fixes every caller.
 */
export const algorithmCacheKeys = {
  // List keys are JSON-stringified query objects (hashed by cacheService internally)
  list:    (query: object)                  => `algo:list:${JSON.stringify(query)}`,

  // Detail keys are structured so we can invalidate by id/slug without re-hashing
  byId:    (id: string,   lang = "default") => `algo:id:${id}:${lang}`,
  bySlug:  (slug: string, lang = "default") => `algo:slug:${slug}:${lang}`,

  // Visualisation / forge config
  viz:     (id: string)                     => `viz:${id}`,
};