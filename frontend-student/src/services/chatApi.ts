import { API_V1_BASE_URL } from "@/services/apiClient";

export type ChatResponse = {
  session_id: string;
  reply: string;
  citations: string[];
};

const isUuid = (value: string | null | undefined) =>
  Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  );

export async function sendChatMessage(payload: {
  message: string;
  subjectId?: string;
  sessionId?: string | null;
}): Promise<ChatResponse | null> {
  const rawToken =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  const token =
    rawToken && rawToken !== "undefined" && rawToken !== "null"
      ? rawToken
      : null;
  const response = await fetch(`${API_V1_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message: payload.message,
      ...(payload.subjectId ? { subject_id: payload.subjectId } : {}),
      ...(isUuid(payload.sessionId ?? null)
        ? { session_id: payload.sessionId }
        : {}),
    }),
  });

  if (response.status === 204 || response.status === 409) {
    return null;
  }
  if (!response.ok) {
    const err = await response.json();
    console.error("Chat API error:", err);

    const error = new Error(err.detail || "Chat request failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }


  return response.json();
}

type StreamHandlers = {
  onSession: (sessionId: string) => void;
  onChunk: (chunk: string) => void;
  onDone: (citations?: string[]) => void;
};

export async function sendChatMessageStream(
  payload: {
    message: string;
    subjectId?: string;
    sessionId?: string | null;
  },
  handlers: StreamHandlers,
) {
  const rawToken =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  const token =
    rawToken && rawToken !== "undefined" && rawToken !== "null"
      ? rawToken
      : null;

  const response = await fetch(`${API_V1_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message: payload.message,
      ...(payload.subjectId ? { subject_id: payload.subjectId } : {}),
      ...(isUuid(payload.sessionId ?? null)
        ? { session_id: payload.sessionId }
        : {}),
    }),
  });

  if (response.status === 204 || response.status === 409) {
    const error = new Error("Chat stream is busy");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  if (!response.ok) {
    const err = await response.json();
    const error = new Error(err.detail || "Chat request failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Chat stream not available");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const lines = part.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          event = line.replace("event:", "").trim();
        } else if (line.startsWith("data:")) {
          data += line.replace("data:", "").trim();
        }
      }
      if (!data) continue;

      const safeParse = () => {
        try {
          return JSON.parse(data);
        } catch (err) {
          console.error("Failed to parse SSE payload", err, data);
          return null;
        }
      };
      if (event === "session") {
        const parsed = safeParse();
        if (parsed?.session_id) handlers.onSession(parsed.session_id);
      }
      if (event === "chunk") {
        const parsed = safeParse();
        if (parsed?.text) handlers.onChunk(parsed.text);
      }
      if (event === "done") {
        const parsed = safeParse();
        handlers.onDone(parsed?.citations ?? []);
      }
      if (event === "error") {
        const parsed = safeParse();
        throw new Error(parsed?.detail || "Chat stream failed");
      }
    }
  }
}

// export async function sendChatMessage(payload: {
//   message: string;
//   subjectId?: string;
//   sessionId?: string | null;
// }): Promise<ChatResponse> {
//   const token =
//     localStorage.getItem("token") ||
//     localStorage.getItem("access_token");

//   const response = await fetch(`${API_V1_BASE_URL}/chat`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//     body: JSON.stringify({
//       message: payload.message,
//       subject_id: payload.subjectId,
//       session_id: payload.sessionId ?? undefined,
//     }),
//   });

//   if (!response.ok) {
//     const err = await response.json(); // ← FastAPI error
//     console.error("Chat API error:", err);

//     const error = new Error(err.detail || "Chat request failed");
//     (error as Error & { status?: number }).status = response.status;
//     throw error;
//   }

//   return response.json();
// }
