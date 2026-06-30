import { API_V1_BASE_URL } from "@/services/apiClient";
import { getAdminAuthHeaders } from "@/services/adminAuth";

export type SubjectFile = {
  id: string;
  subject_id: string;
  original_name: string;
  stored_name: string;
  content_type: string | null;
  size_bytes: number;
  storage_path: string;
};

export type UploadSubjectFileResponse = {
  job_id: string;
  file: SubjectFile;
};

export async function uploadSubjectFile(
  subjectId: string,
  file: File
): Promise<UploadSubjectFileResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_V1_BASE_URL}/subjects/${subjectId}/files`,
    {
      method: "POST",
      headers: {
        ...getAdminAuthHeaders(),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.json();
}

export async function getSubjectFiles(subjectId: string): Promise<SubjectFile[]> {
  const response = await fetch(`${API_V1_BASE_URL}/subjects/${subjectId}/files`);

  if (!response.ok) {
    throw new Error("Failed to fetch files");
  }

  return response.json();
}

export async function deleteSubjectFile(
  subjectId: string,
  fileId: string
): Promise<void> {
  const response = await fetch(
    `${API_V1_BASE_URL}/subjects/${subjectId}/files/${fileId}`,
    {
      method: "DELETE",
      headers: {
        ...getAdminAuthHeaders(),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete file");
  }
}
