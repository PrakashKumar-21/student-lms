import { API_V1_BASE_URL } from "@/services/apiClient";

export type AdminProfile = {
  user_id: string;
  email: string;
  role: string;
};

const ADMIN_TOKEN_KEY = "admin_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getAdminAuthHeaders() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginAdmin(payload: {
  email: string;
  password: string;
}): Promise<{ access_token: string }> {
  const response = await fetch(`${API_V1_BASE_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Invalid admin credentials");
  }
  return response.json();
}

export async function getAdminProfile(): Promise<AdminProfile> {
  const response = await fetch(`${API_V1_BASE_URL}/auth/admin/me`, {
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("Admin session invalid");
  }
  return response.json();
}
