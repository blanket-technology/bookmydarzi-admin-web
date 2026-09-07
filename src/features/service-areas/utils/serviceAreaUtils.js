export function buildServiceAreaPayload(form) {
  return {
    name: form.name.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    radius_km: Number(form.radius_km),
    is_active: form.is_active,
  };
}

export function getVisibleAreas(areas, showInactive) {
  return showInactive ? areas : areas.filter((a) => a.is_active);
}

export function upsertArea(prev, saved) {
  const exists = prev.some((a) => a.id === saved.id);
  return exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [...prev, saved];
}

export function countInactive(areas) {
  return areas.filter((a) => !a.is_active).length;
}

export function countActive(areas) {
  return areas.filter((a) => a.is_active).length;
}
