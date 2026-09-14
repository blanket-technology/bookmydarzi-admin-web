import { useCallback, useEffect, useState } from "react";
import { extractErrorMessage } from "../../../utils/formatters.js";
import { getServiceAreaInterests } from "../services/serviceAreaService.js";

const LIMIT = 20;

// Read-only "notify me" lead list - captured when a customer's booking is
// rejected as outside the current service area (see
// app/api/v1/endpoints/location.py's POST /location/service-area-interest).
// No zustand store needed for a plain paginated read - a local hook mirrors
// this feature's existing useServiceAreas.js shape without adding a second
// piece of global state for something nothing else needs to react to.
export default function useServiceAreaInterests() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServiceAreaInterests({ skip: (page - 1) * LIMIT, limit: LIMIT });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not load interest leads."));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  return {
    items,
    total,
    page,
    limit: LIMIT,
    loading,
    error,
    setPage,
    fetchInterests,
  };
}
