// Shared Excel-style 3-state column sort: click once for ascending, again
// for descending, a third time clears back to the original order. Used by
// DataTable.jsx (the shared table shell) and any hand-rolled table that
// needs the identical click-cycle/compare behavior, like PaymentsTable.jsx.

export function compareValues(a, b) {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (a instanceof Date || b instanceof Date) {
    return new Date(a).getTime() - new Date(b).getTime();
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

// { key, direction } | null -> next state in the cycle for a click on `key`.
export function nextSortState(current, key) {
  if (!current || current.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}

// Stable sort (ties keep original relative order) over `rows` using
// `accessor(row)` for the active sort column, or the rows unchanged if no
// sort is active / the column has no accessor.
export function applySort(rows, sort, accessor) {
  if (!sort || !accessor) return rows;
  const withIndex = rows.map((row, i) => ({ row, i }));
  withIndex.sort((a, b) => {
    const cmp = compareValues(accessor(a.row), accessor(b.row));
    if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp;
    return a.i - b.i;
  });
  return withIndex.map((x) => x.row);
}
