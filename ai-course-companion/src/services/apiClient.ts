const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, "");
export const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;
