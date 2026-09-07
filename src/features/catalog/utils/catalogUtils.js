export function getBaseName(name, parentLineName) {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "normal" || lower === "designer") return parentLineName;
  if (lower.startsWith("normal ")) return trimmed.slice("normal ".length).trim();
  if (lower.startsWith("designer ")) return trimmed.slice("designer ".length).trim();
  return trimmed;
}

export function groupByBaseName(types, parentLineName) {
  const map = new Map();
  for (const t of types) {
    const base = getBaseName(t.name, parentLineName);
    if (!map.has(base)) map.set(base, { baseName: base, normal: null, designer: null, others: [] });
    const g = map.get(base);
    const lower = t.name.toLowerCase().trim();
    if (lower === "normal" || lower.startsWith("normal ")) g.normal = t;
    else if (lower === "designer" || lower.startsWith("designer ")) g.designer = t;
    else g.others.push(t);
  }
  return Array.from(map.values());
}

export function parseCatalogTree(data) {
  return Array.isArray(data) ? data : Array.isArray(data?.categories) ? data.categories : [];
}

export function sortByDisplayOrder(items) {
  return [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

export function getCatalogLevel(selectedCategory, selectedLine, selectedType) {
  if (selectedType) return 3;
  if (selectedLine) return 2;
  if (selectedCategory) return 1;
  return 0;
}

export function buildCatalogCrumbs(selectedCategory, selectedLine, selectedType) {
  return [
    { label: "Catalog" },
    ...(selectedCategory ? [{ label: selectedCategory.name }] : []),
    ...(selectedLine ? [{ label: selectedLine.name }] : []),
    ...(selectedType ? [{ label: selectedType.baseName }] : []),
  ];
}

export function refreshSelectionPointers(categories, selectedCategory, selectedLine, selectedType) {
  if (!selectedCategory) {
    return { selectedCategory: null, selectedLine: null, selectedType: null };
  }

  const freshCategory = categories.find((c) => c.id === selectedCategory.id);
  if (!freshCategory) {
    return { selectedCategory: null, selectedLine: null, selectedType: null };
  }

  let freshLine = selectedLine;
  let freshType = selectedType;

  if (selectedLine) {
    freshLine = freshCategory.service_lines?.find((l) => l.id === selectedLine.id) || null;
    if (freshLine && selectedType) {
      const allTypes = [...(freshLine.stitching_types || [])];
      const groups = groupByBaseName(allTypes, freshLine.name);
      freshType = groups.find((g) => g.baseName === selectedType.baseName) || null;
    } else {
      freshType = null;
    }
  }

  return {
    selectedCategory: freshCategory,
    selectedLine: freshLine,
    selectedType: freshType,
  };
}

export function countActiveCategories(categories) {
  return categories.filter((c) => c.is_active);
}

export function countTotalLines(activeCategories) {
  return activeCategories.reduce((s, c) => s + (c.service_lines?.length || 0), 0);
}
