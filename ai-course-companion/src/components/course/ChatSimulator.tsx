import { useState, useRef, useEffect } from "react";
import { Send, RotateCcw, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendChatMessage } from "@/services/chatApi";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: {
    fileName: string;
    chunk: string;
  }[];
}

interface ChatSimulatorProps {
  courseName?: string;
  subjectId?: string;
}

type ParsedAnswer =
  | {
      type: "math";
      given?: Array<{ name?: string; value?: number; unit?: string }>;
      steps?: Array<{ title?: string; explanation?: string; expression?: string }>;
      final_answer?: unknown;
    }
  | {
      type: "theory";
      title?: string;
      explanation?: string[];
      example?: string;
      summary?: string;
    };

const tryParseAnswer = (text: string): ParsedAnswer | null => {
  try {
    const parsed = JSON.parse(text);
    if (parsed && (parsed.type === "math" || parsed.type === "theory")) {
      return parsed as ParsedAnswer;
    }
    return null;
  } catch {
    return null;
  }
};

const asText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
};

const formatFinalAnswer = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") {
    return <span>{asText(value)}</span>;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return null;
    return (
      <ul className="space-y-1">
        {entries.map(([key, val]) => (
          <li key={key}>
            <span className="font-semibold">{key}:</span> {asText(val)}
          </li>
        ))}
      </ul>
    );
  }
  return <span>{asText(value)}</span>;
};

export function ChatSimulator({
  courseName = "Course",
  subjectId,
}: ChatSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm your AI assistant for "${courseName}". Ask me anything about the course material, and I'll help you find answers based on the uploaded documents.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const shouldShowLoading =
    isLoading && messages[messages.length - 1]?.role === "user";

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: userMessage.content,
        subjectId,
        sessionId,
      });
      setSessionId(response.session_id);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.reply,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status === 402) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Subscription expired. Activate a plan to continue.",
        };
        setMessages((prev) => [...prev, aiMessage]);
        return;
      }
      if (status === 429) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Daily query limit reached for this user.",
        };
        setMessages((prev) => [...prev, aiMessage]);
        return;
      }
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I couldn't reach the knowledge base. Please try again.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: `Hello! I'm your AI assistant for "${courseName}". Ask me anything about the course material, and I'll help you find answers based on the uploaded documents.`,
      },
    ]);
    setSessionId(null);
  };

  const toggleSource = (messageId: string) => {
    setExpandedSources((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface-elevated rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Simulator</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && tryParseAnswer(message.content) ? (
              <div className="max-w-[80%] rounded-lg border border-border bg-card px-4 py-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  Teacher's Answer
                </div>
                {(() => {
                  const parsed = tryParseAnswer(message.content);
                  if (!parsed) return <p className="text-sm">{message.content}</p>;
                  if (parsed.type === "math") {
                    return (
                      <div className="space-y-3">
                        {parsed.given &&
                          parsed.given.some(
                            (item) =>
                              item.name || item.value !== undefined || item.unit,
                          ) && (
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground">
                                Given
                              </div>
                              <ul className="mt-1 space-y-1">
                                {parsed.given
                                  .filter(
                                    (item) =>
                                      item.name ||
                                      item.value !== undefined ||
                                      item.unit,
                                  )
                                  .map((item, idx) => (
                                    <li key={idx} className="text-sm">
                                      <span className="font-semibold">
                                        {asText(item.name || "Value")}:
                                      </span>{" "}
                                      {asText(item.value ?? "")}{" "}
                                      {asText(item.unit ?? "")}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        {parsed.steps && parsed.steps.length > 0 && (
                          <div className="space-y-2">
                            {parsed.steps.map((step, idx) => (
                              <div key={idx} className="rounded-lg bg-muted/40 p-3">
                                <div className="text-sm font-semibold">
                                  {step.title || `Step ${idx + 1}`}
                                </div>
                                {step.explanation && (
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    {asText(step.explanation)}
                                  </div>
                                )}
                                {step.expression && (
                                  <div className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
                                    {asText(step.expression)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {parsed.final_answer && formatFinalAnswer(parsed.final_answer) && (
                          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                            <div className="font-semibold">Final Answer</div>
                            <div className="mt-1">{formatFinalAnswer(parsed.final_answer)}</div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {parsed.title && (
                        <div className="text-base font-semibold">
                          {asText(parsed.title)}
                        </div>
                      )}
                      {parsed.explanation && parsed.explanation.length > 0 && (
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {parsed.explanation.map((point, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                              <span>{asText(point)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {parsed.example && (
                        <div className="rounded-lg bg-muted/40 p-3 text-sm">
                          <span className="font-semibold">Example: </span>
                          {asText(parsed.example)}
                        </div>
                      )}
                      {parsed.summary && (
                        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                          <span className="font-semibold">Summary: </span>
                          {asText(parsed.summary)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2.5",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            )}

            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-border/50">
                <button
                  onClick={() => toggleSource(message.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  <span>{message.sources.length} Sources</span>
                  {expandedSources.includes(message.id) ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>

                {expandedSources.includes(message.id) && (
                  <div className="mt-2 space-y-2">
                    {message.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="bg-muted/50 rounded p-2 text-xs"
                      >
                        <p className="font-medium text-foreground mb-1">
                          {source.fileName}
                        </p>
                        <p className="text-muted-foreground line-clamp-2">
                          {source.chunk}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {shouldShowLoading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-subtle" />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-subtle delay-100" />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-subtle delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this course..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
