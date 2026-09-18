import api from "../../../services/api.js";

export async function getReviews(params) {
  const response = await api.get("/admin/reviews", { params });
  return response.data;
}

export async function hideReview(reviewId, reason) {
  const response = await api.patch(`/admin/reviews/${reviewId}/hide`, {
    reason: reason || undefined,
  });
  return response.data;
}

export async function unhideReview(reviewId) {
  const response = await api.patch(`/admin/reviews/${reviewId}/unhide`);
  return response.data;
}

export async function deleteReview(reviewId) {
  const response = await api.delete(`/admin/reviews/${reviewId}`);
  return response.data;
}
