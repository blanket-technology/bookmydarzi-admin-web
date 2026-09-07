import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PAGE_SIZE } from "../constants/leaveConstants.js";
import { leaveRequestsQueryKey } from "../../../services/queryKeys.js";
import { getLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from "../services/leaveService.js";
import { extractErrorMessage } from "../../../utils/formatters.js";

export default function useLeaveRequests() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilterState] = useState("");
  const [roleFilter, setRoleFilterState] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const setStatusFilter = (value) => {
    setStatusFilterState(value);
    setPage(1);
  };
  const setRoleFilter = (value) => {
    setRoleFilterState(value);
    setPage(1);
  };

  const params = { page, limit: PAGE_SIZE, status: statusFilter || undefined, role: roleFilter || undefined };
  const queryKey = leaveRequestsQueryKey({ page, statusFilter, roleFilter });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getLeaveRequests(params),
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const loading = isLoading;
  const errorMessage = isError ? extractErrorMessage(error, "Failed to load leave requests.") : "";
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
  };

  const approve = async (requestId, adminNotes) => {
    setActionLoading(true);
    setActionError("");
    try {
      await approveLeaveRequest(requestId, adminNotes);
      setSelectedId(null);
      invalidate();
    } catch (err) {
      setActionError(extractErrorMessage(err, "Failed to approve leave request."));
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async (requestId, adminNotes) => {
    setActionLoading(true);
    setActionError("");
    try {
      await rejectLeaveRequest(requestId, adminNotes);
      setSelectedId(null);
      invalidate();
    } catch (err) {
      setActionError(extractErrorMessage(err, "Failed to reject leave request."));
    } finally {
      setActionLoading(false);
    }
  };

  return {
    items,
    total,
    page,
    statusFilter,
    roleFilter,
    loading,
    error: errorMessage,
    selectedId,
    totalPages,
    actionLoading,
    actionError,
    setPage,
    setStatusFilter,
    setRoleFilter,
    setSelectedId,
    approve,
    reject,
    fetchLeaveRequests: refetch,
  };
}
