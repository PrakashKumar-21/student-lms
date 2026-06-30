import { API_V1_BASE_URL } from "@/services/apiClient";
import { getAdminAuthHeaders } from "@/services/adminAuth";

export type ClassLevel = {
  id: string;
  name: string;
  board_id: string;
  status: string;
};

export async function getClasses(params: {
  board: string;
  boardId?: string;
  includeInactive?: boolean;
}): Promise<ClassLevel[]> {
  const query = new URLSearchParams({ board: params.board });
  if (params.boardId) {
    query.set("board_id", params.boardId);
  }
  if (params.includeInactive) {
    query.set("include_inactive", "true");
  }
  const response = await fetch(`${API_V1_BASE_URL}/classes?${query.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch classes");
  }

  return response.json();
}

export async function createClass(payload: {
  name: string;
  board_id: string;
}): Promise<ClassLevel> {
  const response = await fetch(`${API_V1_BASE_URL}/classes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create class");
  }

  return response.json();
}

export async function updateClassStatus(
  classId: string,
  status: "active" | "inactive"
): Promise<ClassLevel> {
  const response = await fetch(`${API_V1_BASE_URL}/classes/${classId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Failed to update class status");
  }

  return response.json();
}

export async function deleteClass(classId: string): Promise<void> {
  const response = await fetch(`${API_V1_BASE_URL}/classes/${classId}`, {
    method: "DELETE",
    headers: {
      ...getAdminAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete class");
  }
}
