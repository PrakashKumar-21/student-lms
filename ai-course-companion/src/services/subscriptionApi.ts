import { API_V1_BASE_URL } from "@/services/apiClient";
import { getAdminAuthHeaders } from "@/services/adminAuth";

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  amount_paise: number;
  currency: string;
  interval: string;
  max_queries_per_day?: number | null;
  max_queries_per_month?: number | null;
};

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await fetch(`${API_V1_BASE_URL}/subscriptions/plans`);
  if (!response.ok) {
    throw new Error("Failed to fetch subscription plans");
  }
  return response.json();
}

export async function createSubscriptionPlan(payload: {
  name: string;
  price: string;
  description?: string;
  features: string[];
  amount_paise: number;
  currency?: string;
  interval?: string;
}): Promise<SubscriptionPlan> {
  const response = await fetch(`${API_V1_BASE_URL}/subscriptions/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create subscription plan");
  }
  return response.json();
}

export async function updateSubscriptionPlan(
  id: string,
  payload: {
    name?: string;
    price?: string;
    description?: string;
    features?: string[];
    amount_paise?: number;
    currency?: string;
    interval?: string;
  },
): Promise<SubscriptionPlan> {
  const response = await fetch(`${API_V1_BASE_URL}/subscriptions/plans/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to update subscription plan");
  }
  return response.json();
}

export async function deleteSubscriptionPlan(id: string): Promise<void> {
  const response = await fetch(`${API_V1_BASE_URL}/subscriptions/plans/${id}`, {
    method: "DELETE",
    headers: { ...getAdminAuthHeaders() },
  });
  if (!response.ok) {
    throw new Error("Failed to delete subscription plan");
  }
}
