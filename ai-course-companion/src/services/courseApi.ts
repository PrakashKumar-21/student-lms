import { CourseStatus } from "@/lib/courseStatus";
import { API_V1_BASE_URL } from "@/services/apiClient";
import { getAdminAuthHeaders } from "@/services/adminAuth";

export async function createCourse(data: {
  title: string;
  board_id: string;
  class_id: string;
}) {
  const response = await fetch(`${API_V1_BASE_URL}/subjects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify({
      name: data.title,
      board_id: data.board_id,
      class_id: data.class_id,
      status: "Draft",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create course");
  }

  return response.json();
}

export async function getCourses(params: {
  board: string;
  classLevel: string;
  boardId: string;
  classId: string;
}) {
  const query = new URLSearchParams({
    board: params.board,
    class: params.classLevel,
    board_id: params.boardId,
    class_id: params.classId,
  });
  const response = await fetch(`${API_V1_BASE_URL}/subjects?${query.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }

  return response.json();
}

export async function getCourse(subject_id: string) {
  const response = await fetch(`${API_V1_BASE_URL}/subjects/${subject_id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch course");
  }

  return response.json();
}

export async function updateCourseStatus(
  subject_id: string,
  status: CourseStatus
) {
  const response = await fetch(`${API_V1_BASE_URL}/subjects/${subject_id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify({
      status: status === CourseStatus.Published ? "active" : "draft",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update course status");
  }

  return response.json();
}

export async function updateCourseName(subject_id: string, name: string) {
  const response = await fetch(`${API_V1_BASE_URL}/subjects/${subject_id}/name`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("Failed to update course name");
  }

  return response.json();
}



export async function deleteCourse(subject_id: string) {
  const response = await fetch(
    `${API_V1_BASE_URL}/subjects/${subject_id}`,
    {
      method: "DELETE",
      headers: {
        ...getAdminAuthHeaders(),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete course");
  }
}

