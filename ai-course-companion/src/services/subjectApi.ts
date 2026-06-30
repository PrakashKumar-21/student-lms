import { API_V1_BASE_URL } from "@/services/apiClient";

export type Subject = {
  id: string;
  name: string;
  status: string;
  board_id: string;
  class_level_id: string;
};

export async function getSubjects(params: {
  board: string;
  classLevel: string;
  boardId?: string;
  classId?: string;
}): Promise<Subject[]> {
  const query = new URLSearchParams({
    board: params.board,
    class: params.classLevel,
  });
  if (params.boardId) {
    query.set("board_id", params.boardId);
  }
  if (params.classId) {
    query.set("class_id", params.classId);
  }
  const response = await fetch(`${API_V1_BASE_URL}/subjects?${query.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch subjects");
  }

  return response.json();
}
