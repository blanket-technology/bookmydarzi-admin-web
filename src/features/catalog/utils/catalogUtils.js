export function parseCatalogTree(data) {
  return Array.isArray(data) ? data : Array.isArray(data?.categories) ? data.categories : [];
}

export function sortByDisplayOrder(items) {
  return [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

export function countActiveCategories(categories) {
  return categories.filter((c) => c.is_active);
}

export function countTotalLines(activeCategories) {
  return activeCategories.reduce((s, c) => s + (c.service_lines?.length || 0), 0);
}
