import { API_V1_BASE_URL } from "@/services/apiClient";

export type Board = {
  id: string;
  name: string;
  status: string;
};

export async function getBoards(): Promise<Board[]> {
  const response = await fetch(`${API_V1_BASE_URL}/boards`);

  if (!response.ok) {
    throw new Error("Failed to fetch boards");
  }

  return response.json();
}
