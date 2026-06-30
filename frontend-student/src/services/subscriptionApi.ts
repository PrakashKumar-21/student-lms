import { API_V1_BASE_URL } from "@/services/apiClient";

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  amount_paise: number;
  currency: string;
  interval: string;
};

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await fetch(`${API_V1_BASE_URL}/subscriptions/plans`);
  if (!response.ok) {
    throw new Error("Failed to load subscription plans");
  }
  return response.json();
}

export async function createSubscriptionCheckout(planId: string): Promise<{
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_V1_BASE_URL}/subscriptions/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ plan_id: planId }),
  });
  if (!response.ok) {
    throw new Error("Failed to create checkout");
  }
  return response.json();
}

export async function verifySubscriptionPayment(payload: {
  plan_id: string;
  order_id: string;
  payment_id: string;
  signature: string;
}): Promise<{ status: string; plan_id: string }> {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_V1_BASE_URL}/subscriptions/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to verify payment");
  }
  return response.json();
}

export async function activateFreePlan(planId: string): Promise<{ status: string; plan: string }> {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  const response = await fetch(`${API_V1_BASE_URL}/subscriptions/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ plan_id: planId }),
  });
  if (!response.ok) {
    throw new Error("Failed to activate plan");
  }
  return response.json();
}
