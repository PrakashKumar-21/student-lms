 const API_BASE = import.meta.env.VITE_API_BASE_URL;


export async function uploadFile(appId: string, file: File) {
  const formData = new FormData();
  formData.append("app_id", appId);
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("File upload failed");
  }

  return response.json(); 
  // { task_id, status, file_id }
}
