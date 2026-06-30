import { API_V1_BASE_URL } from "@/services/apiClient";

export type ClassLevel = {
  id: string;
  name: string;
  board_id: string;
  status: string;
};

export async function getClasses(params: {
  board: string;
  boardId?: string;
}): Promise<ClassLevel[]> {
  const query = new URLSearchParams({ board: params.board });
  if (params.boardId) {
    query.set("board_id", params.boardId);
  }
  const response = await fetch(`${API_V1_BASE_URL}/classes?${query.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch classes");
  }

  return response.json();
}
