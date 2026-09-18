import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getReviews, hideReview, unhideReview, deleteReview } from "../services/reviewService.js";
import { extractErrorMessage } from "../../../utils/formatters.js";

const PAGE_SIZE = 20;

export default function useReviews() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  // "" = all, "true" = hidden only, "false" = visible only - matches the
  // backend's Optional[bool] `hidden` query param exactly.
  const [hiddenFilter, setHiddenFilterState] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const setHiddenFilter = (value) => {
    setHiddenFilterState(value);
    setPage(1);
  };

  const params = { page, limit: PAGE_SIZE, hidden: hiddenFilter === "" ? undefined : hiddenFilter };
  const queryKey = ["admin-reviews", page, hiddenFilter];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getReviews(params),
    placeholderData: (prev) => prev,
  });

  const items = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  const hide = async (reviewId, reason) => {
    setActionLoading(true);
    setActionError("");
    try {
      await hideReview(reviewId, reason);
      invalidate();
    } catch (err) {
      setActionError(extractErrorMessage(err, "Failed to hide review."));
    } finally {
      setActionLoading(false);
    }
  };

  const unhide = async (reviewId) => {
    setActionLoading(true);
    setActionError("");
    try {
      await unhideReview(reviewId);
      invalidate();
    } catch (err) {
      setActionError(extractErrorMessage(err, "Failed to unhide review."));
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async (reviewId) => {
    setActionLoading(true);
    setActionError("");
    try {
      await deleteReview(reviewId);
      invalidate();
    } catch (err) {
      setActionError(extractErrorMessage(err, "Failed to delete review."));
    } finally {
      setActionLoading(false);
    }
  };

  return {
    items,
    total,
    page,
    hiddenFilter,
    loading: isLoading,
    error: isError ? extractErrorMessage(error, "Failed to load reviews.") : "",
    totalPages,
    actionLoading,
    actionError,
    setPage,
    setHiddenFilter,
    hide,
    unhide,
    remove,
    fetchReviews: refetch,
  };
}
