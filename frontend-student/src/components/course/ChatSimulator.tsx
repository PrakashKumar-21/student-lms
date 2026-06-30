import { useState, useRef, useEffect } from "react";
import { Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { chatWithCourse } from "@/services/chatApi";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSimulatorProps {
  courseName?: string;
}

export function ChatSimulator({ courseName = "Course" }: ChatSimulatorProps) {
  const { id: courseId } = useParams<{ id: string }>();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your AI assistant for "${courseName}". Ask me any question and I will explain it clearly.`,
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------- FORMAT ANSWER ---------- */
  const formatAnswer = (answer: any): string => {
    if (!answer || !answer.type) {
      return "I could not find an answer in this course material.";
    }

    if (answer.type === "greeting") {
      return answer.message;
    }

    if (answer.type === "math") {
      const steps = answer.steps
        ?.map(
          (s: any) =>
            `${s.title}\n${s.explanation}\n${s.expression}`
        )
        .join("\n\n");

      return `
Given:
${answer.given
  ?.map((g: any) => `${g.name} = ${g.value} ${g.unit}`)
  .join("\n")}

${steps}

Final Answer:
${answer.final_answer}
      `.trim();
    }

//     if (answer.type === "theory") {
//       return `
// ${answer.title}

// ${answer.explanation?.map((p: string) => `• ${p}`).join("\n")}

// ${answer.example ? `Example:\n${answer.example}` : ""}
// ${answer.summary ? `Summary:\n${answer.summary}` : ""}
//       `.trim();
//     }
      if (answer.type === "theory") {
        const explanation = answer.explanation
          ?.map((p: string, i: number) => `${i + 1}. ${p}`)
          .join("\n\n");

        return `
      📘 ${answer.title}

      ${explanation}

      ${answer.example ? `\n Example:\n${answer.example}` : ""}
      ${answer.summary ? `\n In short:\n${answer.summary}` : ""}
        `.trim();
      }


    return "Answer format not supported.";
  };

  /* ---------- SEND ---------- */
  const handleSend = async () => {
    if (!input.trim() || isLoading || !courseId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithCourse({
        // sessionId,
        // course_id: courseId,
        // question: userMessage.content,
        message: userMessage.content,
        subjectId: courseId,
        sessionId,
      });
      setSessionId(response.session_id)
      console.log("Chat response:", response);

      const aiMessage: Message = {
        id: `${Date.now()}-ai`,
        role: "assistant",
        content: formatAnswer(response.answer),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          content:
            "Sorry, I could not find this answer in the course material.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };


  /* ---------- CLEAR ---------- */
  const handleClear = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm your AI assistant for "${courseName}". Ask me any question and I will explain it clearly.`,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-surface-elevated rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-medium">Simulator</h3>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2.5 whitespace-pre-line",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="bg-card border rounded px-4 py-2 w-fit">
            Thinking…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 border-t flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this course..."
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
