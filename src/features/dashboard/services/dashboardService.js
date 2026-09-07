import api from "../../../services/api.js";
import {
  DASHBOARD_ENDPOINTS,
  EMPLOYEE_ORDERS_LIMIT,
  RECENT_ORDERS_LIMIT,
  TAILOR_ORDERS_LIMIT,
} from "../constants/dashboardConstants.js";

export async function fetchDashboardData() {
  const response = await api.get(DASHBOARD_ENDPOINTS.DASHBOARD);
  return response.data;
}

export async function fetchRecentOrders(limit = RECENT_ORDERS_LIMIT) {
  const response = await api.get(DASHBOARD_ENDPOINTS.ADMIN_ORDERS, {
    params: { page: 1, limit },
  });
  return response.data?.orders ?? [];
}

export async function fetchEmployeeOrders(limit = EMPLOYEE_ORDERS_LIMIT) {
  const response = await api.get(DASHBOARD_ENDPOINTS.ADMIN_ORDERS, {
    params: { page: 1, limit },
  });
  return response.data?.orders ?? [];
}

export async function fetchTailorOrders(limit = TAILOR_ORDERS_LIMIT) {
  const response = await api.get(DASHBOARD_ENDPOINTS.TAILOR_ORDERS, {
    params: { page: 1, limit },
  });
  return response.data?.orders ?? [];
}
