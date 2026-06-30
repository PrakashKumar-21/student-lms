import { API_V1_BASE_URL } from "@/services/apiClient";
import { getAdminAuthHeaders, getAdminToken } from "@/services/adminAuth";

export type ChatResponse = {
  session_id: string;
  reply: string;
  citations: string[];
};

export async function sendChatMessage(payload: {
  message: string;
  subjectId?: string;
  sessionId?: string | null;
}): Promise<ChatResponse> {
  const adminToken = getAdminToken();
  const token =
    adminToken || localStorage.getItem("token") || localStorage.getItem("access_token");
  const response = await fetch(`${API_V1_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message: payload.message,
      subject_id: payload.subjectId,
      session_id: payload.sessionId ?? undefined,
    }),
  });

  if (!response.ok) {
    const error = new Error("Failed to send chat message");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}
