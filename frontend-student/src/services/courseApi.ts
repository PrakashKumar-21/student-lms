const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function createCourse(data: {
  title: string;
  description?: string;
  app_id: string;
  file_ids: string[];
}) {
  const response = await fetch(`${API_BASE}/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create course");
  }

  return response.json();
}

export async function getCourses(app_id: string) {
  const response = await fetch(`${API_BASE}/courses/${app_id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }

  return response.json();
}

export async function deleteCourse(app_id: string, course_id: string) {
  const response = await fetch(
    `${API_BASE}/courses/${app_id}/${course_id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete course");
  }

  return response.json();
}

export async function getCourseDetails(appId: string, courseId: string) {
  const response = await fetch(
    `${API_BASE}/courses/${appId}/${courseId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch course details");
  }

  return response.json();
}

export async function attachFilesToCourse(
  appId: string,
  courseId: string,
  fileIds: string[]
) {
  const response = await fetch(
    `${API_BASE}/courses/${courseId}/files`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: appId,
        file_ids: fileIds,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to attach files");
  }

  return response.json();
}

