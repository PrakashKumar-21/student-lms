import { API_V1_BASE_URL } from "@/services/apiClient";
import { getAdminAuthHeaders } from "@/services/adminAuth";

export type UserWithPlan = {
  id: string;
  phone_or_email: string;
  full_name: string | null;
  subscription: {
    plan_id: string | null;
    plan_name: string | null;
    status: string;
    expires_at: string | null;
    is_active: boolean;
  };
};

export async function getUsers(): Promise<UserWithPlan[]> {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  const response = await fetch(`${API_V1_BASE_URL}/users`, {
    headers: {
      ...getAdminAuthHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
}
