import { API_V1_BASE_URL } from "@/services/apiClient";
import { getAdminAuthHeaders } from "@/services/adminAuth";

export type Board = {
  id: string;
  name: string;
  status: string;
};

export async function getBoards(params?: {
  includeInactive?: boolean;
}): Promise<Board[]> {
  const query = new URLSearchParams();
  if (params?.includeInactive) {
    query.set("include_inactive", "true");
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_V1_BASE_URL}/boards${suffix}`);

  if (!response.ok) {
    throw new Error("Failed to fetch boards");
  }

  return response.json();
}

export async function createBoard(name: string): Promise<Board> {
  const response = await fetch(`${API_V1_BASE_URL}/boards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("Failed to create board");
  }

  return response.json();
}

export async function updateBoardStatus(
  boardId: string,
  status: "active" | "inactive"
): Promise<Board> {
  const response = await fetch(`${API_V1_BASE_URL}/boards/${boardId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update board status");
  }

  return response.json();
}

export async function deleteBoard(boardId: string): Promise<void> {
  const response = await fetch(`${API_V1_BASE_URL}/boards/${boardId}`, {
    method: "DELETE",
    headers: {
      ...getAdminAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete board");
  }
}
