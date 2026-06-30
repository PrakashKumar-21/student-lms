import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mic } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useTheme } from "@/hooks/useTheme";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { getBoards, type Board } from "@/services/boardApi";
import { getClasses, type ClassLevel } from "@/services/classApi";
import { fetchSubjects, type Subject } from "@/services/subjectsApi";
import { sendChatMessage, sendChatMessageStream } from "@/services/chatApi";

type Message = {
  sender: "bot" | "user";
  text: string;
  isStreaming?: boolean;
};

type SubjectOption = Subject & { locked?: boolean };

const buildWelcome = (subjectName: string) =>
  subjectName
    ? `Welcome! Let's explore ${subjectName} together. Ask your first question.`
    : "Choose a board, class, and subject to begin.";

const getChatStorageKey = (subjectId: string) => `tutor-chat:${subjectId}`;
const SELECTION_STORAGE_KEY = "tutor-selection";

type ParsedAnswer =
  | {
      type: "math";
      given?: Array<{ name?: string; value?: number; unit?: string }>;
      steps?: Array<{ title?: string; explanation?: string; expression?: string }>;
      final_answer?: string;
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

const parseStoredMessages = (value: unknown): Message[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Message =>
      Boolean(item) &&
      typeof item === "object" &&
      "sender" in item &&
      "text" in item &&
      (item as Message).sender !== undefined &&
      typeof (item as Message).text === "string",
  );
};

const TutorChat = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const storedSelectionRef = useRef<{
    board?: string;
    class?: string;
    subject?: string;
    board_id?: string;
    class_id?: string;
    subject_id?: string;
  } | null>(null);
  if (!storedSelectionRef.current) {
    const cached = localStorage.getItem(SELECTION_STORAGE_KEY);
    if (cached) {
      try {
        storedSelectionRef.current = JSON.parse(cached);
      } catch {
        storedSelectionRef.current = null;
      }
    }
  }
  const initialBoard =
    storedSelectionRef.current?.board ?? searchParams.get("board") ?? "";
  const initialClass =
    storedSelectionRef.current?.class ?? searchParams.get("class") ?? "";
  const initialSubject =
    storedSelectionRef.current?.subject ?? searchParams.get("subject") ?? "";
  const initialBoardId =
    storedSelectionRef.current?.board_id ?? searchParams.get("board_id") ?? "";
  const initialClassId =
    storedSelectionRef.current?.class_id ?? searchParams.get("class_id") ?? "";
  const initialSubjectId =
    storedSelectionRef.current?.subject_id ?? searchParams.get("subject_id") ?? "";
  const normalizedInitialClass = useMemo(() => {
    if (!initialClass) return "";
    if (initialClass.startsWith("Class ")) return initialClass;
    if (/^\d+$/.test(initialClass)) return `Class ${initialClass}`;
    return initialClass;
  }, [initialClass]);

  const [selectedBoard, setSelectedBoard] = useState(() => initialBoard);
  const [selectedClass, setSelectedClass] = useState(
    () => normalizedInitialClass,
  );
  const [selectedSubject, setSelectedSubject] = useState(() => initialSubject);
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    initialSubjectId
  );
  const [boardId, setBoardId] = useState(initialBoardId);
  const [classId, setClassId] = useState(initialClassId);
  const [boardOptions, setBoardOptions] = useState<Board[]>([]);
  const [classOptions, setClassOptions] = useState<ClassLevel[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingSubject, setPendingSubject] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const sendingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const hasManualSubjectRef = useRef(false);

  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: buildWelcome(initialSubject) },
  ]);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognitionRef.current = recognition;
  }, []);

  const startVoiceInput = () => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      alert("Voice input not supported in this browser");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setDraft("");
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDraft(transcript);
      recognition.stop();
      setIsListening(false);
      setIsSpeechActive(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    recognition.onerror = (event: any) => {
      console.error("Voice error:", event.error);
      recognition.stop();
      setIsListening(false);
      setIsSpeechActive(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsSpeechActive(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    };

    recognition.onspeechstart = () => {
      setIsSpeechActive(true);
    };

    recognition.onspeechend = () => {
      setIsSpeechActive(false);
    };

    recognition.start();
  };

  const availableBoards = useMemo(
    () => boardOptions.map((item) => item.name),
    [boardOptions],
  );

  const availableClasses = useMemo(
    () => classOptions.map((item) => item.name),
    [classOptions],
  );

  const availableSubjects = useMemo(
    () => subjectOptions,
    [subjectOptions],
  );

  useEffect(() => {
    let mounted = true;
    async function loadBoards() {
      try {
        const data = await getBoards();
        if (!mounted) return;
        setBoardOptions(data);
        const preferredBoardId = storedSelectionRef.current?.board_id;
        if (preferredBoardId) {
          const match = data.find((item) => item.id === preferredBoardId);
          if (match) {
            setSelectedBoard(match.name);
            setBoardId(match.id);
            return;
          }
        }
        if (initialBoard) {
          const match = data.find((item) => item.name === initialBoard);
          if (match) {
            setSelectedBoard(match.name);
            setBoardId(match.id);
            return;
          }
        }
        if (data.length > 0) {
          setSelectedBoard(data[0].name);
          setBoardId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load boards", error);
      }
    }
    loadBoards();
    return () => {
      mounted = false;
    };
  }, [initialBoard]);

  useEffect(() => {
    let mounted = true;
    async function loadClasses() {
      if (!selectedBoard) {
        setClassOptions([]);
        setSelectedClass("");
        setClassId("");
        return;
      }
      const boardMeta = boardOptions.find((item) => item.name === selectedBoard);
      if (!boardMeta) {
        setClassOptions([]);
        setSelectedClass("");
        setClassId("");
        return;
      }
      setBoardId(boardMeta.id);
      try {
        const data = await getClasses({
          board: boardMeta.name,
          boardId: boardMeta.id,
        });
        if (!mounted) return;
        setClassOptions(data);
        const preferredClassId = storedSelectionRef.current?.class_id;
        if (preferredClassId) {
          const match = data.find((item) => item.id === preferredClassId);
          if (match) {
            setSelectedClass(match.name);
            setClassId(match.id);
            return;
          }
        }
        if (normalizedInitialClass) {
          const match = data.find((item) => item.name === normalizedInitialClass);
          if (match) {
            setSelectedClass(match.name);
            setClassId(match.id);
            return;
          }
        }
        if (data.length > 0) {
          setSelectedClass(data[0].name);
          setClassId(data[0].id);
        } else {
          setSelectedClass("");
          setClassId("");
        }
      } catch (error) {
        console.error("Failed to load classes", error);
        setClassOptions([]);
        setSelectedClass("");
        setClassId("");
      }
    }
    loadClasses();
    return () => {
      mounted = false;
    };
  }, [boardOptions, selectedBoard, normalizedInitialClass]);

  useEffect(() => {
    let mounted = true;
    async function loadSubjects() {
      if (!selectedBoard || !selectedClass) {
        setSubjectOptions([]);
        setIsLoadingSubjects(false);
        return;
      }
      setIsLoadingSubjects(true);
      try {
        const data = await fetchSubjects({
          board: selectedBoard,
          className: selectedClass,
          boardId: boardId || undefined,
          classId: classId || undefined,
        });
        if (!mounted) return;
        const activeSubjects = data.filter(
          (item) => item.status.toLowerCase() === "active",
        );
        setSubjectOptions(activeSubjects);
        const preferredSubjectId = storedSelectionRef.current?.subject_id;
        if (preferredSubjectId && !hasManualSubjectRef.current) {
          const match = activeSubjects.find((item) => item.id === preferredSubjectId);
          if (match) {
            setSelectedSubject(match.name);
            setSelectedSubjectId(match.id);
            return;
          }
        }
        if (selectedSubject) {
          const match = activeSubjects.find(
            (item) => item.name === selectedSubject,
          );
          if (match) {
            setSelectedSubjectId(match.id);
          } else {
            setSelectedSubject("");
            setSelectedSubjectId("");
          }
        } else if (activeSubjects.length > 0 && !selectedSubjectId) {
          setSelectedSubject(activeSubjects[0].name);
          setSelectedSubjectId(activeSubjects[0].id);
        }
      } catch (error) {
        console.error("Failed to load subjects", error);
        setSubjectOptions([]);
      } finally {
        if (mounted) {
          setIsLoadingSubjects(false);
          setIsHydrating(false);
        }
      }
    }
    loadSubjects();
    return () => {
      mounted = false;
    };
  }, [selectedBoard, selectedClass, boardId, classId, selectedSubject]);

  useEffect(() => {
    if (isHydrating) return;
    if (!selectedBoard) {
      setSelectedClass("");
      setSelectedSubject("");
    }
  }, [selectedBoard, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    if (!selectedClass) {
      setSelectedSubject("");
    }
  }, [selectedClass, isHydrating]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const handleMedia = () => {
      const mobile = media.matches;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
      if (mobile) {
        setIsCollapsed(false);
      }
    };
    handleMedia();
    if (media.addEventListener) {
      media.addEventListener("change", handleMedia);
      return () => media.removeEventListener("change", handleMedia);
    }
    media.addListener(handleMedia);
    return () => media.removeListener(handleMedia);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const hasStreamingMessage = messages.some(
    (message) => message.sender === "bot" && message.isStreaming,
  );

  useEffect(() => {
    if (!selectedSubjectId) {
      setMessages([{ sender: "bot", text: buildWelcome(selectedSubject) }]);
      setSessionId(null);
      return;
    }
    const storageKey = getChatStorageKey(selectedSubjectId);
    const cached = localStorage.getItem(storageKey);
    if (!cached) {
      setMessages([{ sender: "bot", text: buildWelcome(selectedSubject) }]);
      setSessionId(null);
      return;
    }
    try {
      const parsed = JSON.parse(cached) as {
        messages?: Message[];
        sessionId?: unknown;
      };
      const restoredMessages = parseStoredMessages(parsed.messages);
      const storedSessionId =
        typeof parsed.sessionId === "string" ? parsed.sessionId : null;
      if (restoredMessages.length > 0) {
        setMessages(restoredMessages);
        setSessionId(storedSessionId);
        return;
      }
    } catch (error) {
      console.error("Failed to parse chat history", error);
    }
    setMessages([{ sender: "bot", text: buildWelcome(selectedSubject) }]);
    setSessionId(null);
  }, [selectedSubjectId, selectedSubject]);

  useEffect(() => {
    if (!selectedSubjectId) return;
    const storageKey = getChatStorageKey(selectedSubjectId);
    localStorage.setItem(
      storageKey,
      JSON.stringify({ messages, sessionId }),
    );
  }, [messages, sessionId, selectedSubjectId]);

  useEffect(() => {
    if (isHydrating) return;
    const nextSelection = {
      board: selectedBoard,
      class: selectedClass,
      subject: selectedSubject,
      board_id: boardId,
      class_id: classId,
      subject_id: selectedSubjectId,
    };
    localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(nextSelection));
    storedSelectionRef.current = nextSelection;
  }, [
    selectedBoard,
    selectedClass,
    selectedSubject,
    boardId,
    classId,
    selectedSubjectId,
    isHydrating,
  ]);

  const hasSelection = Boolean(
    selectedBoard && selectedClass && selectedSubject,
  );

  const appendStreamingChunk = (chunk: string) => {
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].sender === "bot" && next[i].isStreaming) {
          next[i] = { ...next[i], text: next[i].text + chunk };
          break;
        }
      }
      return next;
    });
  };

  const finalizeStreaming = () => {
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].sender === "bot" && next[i].isStreaming) {
          next[i] = { ...next[i], isStreaming: false };
          break;
        }
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    if (isTyping) {
      sendingRef.current = false;
      return;
    }
    if (!draft.trim() || !selectedSubjectId) {
      sendingRef.current = false;
      return;
    }
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    const question = draft;
    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setDraft("");
    window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    });
    setIsTyping(true);
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "", isStreaming: true },
    ]);
    try {
      await sendChatMessageStream(
        {
          message: question,
          subjectId: selectedSubjectId,
          sessionId,
        },
        {
          onSession: (nextSessionId) => setSessionId(nextSessionId),
          onChunk: (chunk) => appendStreamingChunk(chunk),
          onDone: () => finalizeStreaming(),
        },
      );
    } catch (error) {
      finalizeStreaming();
      console.error("Chat stream failed:", error);
      const status = (error as Error & { status?: number }).status;
      if (status === 204 || status === 409) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Your previous request is still processing. Please wait a moment.",
          },
        ]);
        return;
      }
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Your session expired. Please log in again.",
          },
        ]);
        navigate("/login");
        return;
      }
      if (status === 402) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Your subscription has expired. Please renew to continue chatting.",
          },
        ]);
        navigate("/subscription");
        return;
      }
      if (status === 429) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Daily query limit reached. Please try again tomorrow or upgrade your plan.",
          },
        ]);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I couldn't reach the tutor right now. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
      sendingRef.current = false;
    }
  };

  const handleBoardChange = (value: string) => {
    setSelectedBoard(value);
    setSelectedClass("");
    setSelectedSubject("");
    setSelectedSubjectId("");
    setSubjectOptions([]);
    setMessages([{ sender: "bot", text: buildWelcome("") }]);
    setDraft("");
    setIsTyping(false);
    setSessionId(null);
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    const match = classOptions.find((item) => item.name === value);
    setClassId(match?.id ?? "");
    setSelectedSubject("");
    setSelectedSubjectId("");
    setSubjectOptions([]);
    setMessages([{ sender: "bot", text: buildWelcome("") }]);
    setDraft("");
    setIsTyping(false);
    setSessionId(null);
  };

  const confirmSubjectChange = (subjectName: string) => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    const subjectMeta = subjectOptions.find(
      (item) => item.name === subjectName,
    );
    hasManualSubjectRef.current = true;
    setSelectedSubject(subjectName);
    setSelectedSubjectId(subjectMeta?.id ?? "");
    setMessages([{ sender: "bot", text: buildWelcome(subjectName) }]);
    setDraft("");
    setIsTyping(false);
    setSessionId(null);
    setShowConfirm(false);
    setPendingSubject(null);
  };

  const handleSubjectSelect = (subjectName: string) => {
    if (!subjectName || subjectName === selectedSubject) return;
    if (!selectedSubject) {
      confirmSubjectChange(subjectName);
      return;
    }
    setPendingSubject(subjectName);
    setShowConfirm(true);
  };

  const handleClearChat = () => {
    if (!selectedSubjectId) return;
    localStorage.removeItem(getChatStorageKey(selectedSubjectId));
    setMessages([{ sender: "bot", text: buildWelcome(selectedSubject) }]);
    setDraft("");
    window.requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    });
    setIsTyping(false);
    setSessionId(null);
  };
  const handleExpandSidebar = () => setIsCollapsed(false);

  const resizeTextarea = (value: string) => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = 160;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };


  return (
    <div className={`min-h-screen bg-background ${theme === "dark" ? "dark" : ""}`}>
      <AppHeader
        showThemeToggle
        showTagline={false}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <div className="mx-auto flex h-[calc(100vh-64px)] w-full max-w-7xl flex-col gap-6 overflow-hidden px-4 py-6 sm:flex-row">
        {isMobile && isSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/40"
          />
        )}
        <StudentSidebar
          isMobile={isMobile}
          isSidebarOpen={isSidebarOpen}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onExpand={handleExpandSidebar}
          selectedBoard={selectedBoard}
          selectedClass={selectedClass}
          selectedSubject={selectedSubject}
          availableBoards={availableBoards}
          availableClasses={availableClasses}
          availableSubjects={availableSubjects}
          isLoadingSubjects={isLoadingSubjects}
          onBoardChange={handleBoardChange}
          onClassChange={handleClassChange}
          onSubjectSelect={handleSubjectSelect}
          onLogout={() => {
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
          }}
        />

        <main className="flex h-full flex-1 flex-col gap-4 min-h-0">
          <section className="relative flex flex-1 min-h-0 flex-col rounded-3xl border border-border bg-card p-6 shadow-lg">
           <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            {/* Left: Subject + Path */}
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-foreground">
                {hasSelection ? selectedSubject : "Pick your learning path"}
              </div>
              {/* {hasSelection &&
                <div className="text-xs text-muted-foreground">
                  {selectedBoard} • {selectedClass}
                </div>
              )} */}
              <p className="mt-2 text-sm text-muted-foreground">
              {hasSelection
                ? `${selectedBoard} | ${selectedClass} | ${selectedSubject}`
                : "Choose board, class, and subject from the sidebar to start chatting."}
            </p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
                >
                  Filters
                </button>
              )}

              <button
                type="button"
                onClick={handleClearChat}
                disabled={!selectedSubjectId}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted disabled:opacity-60"
              >
                Clear
              </button>
            </div>
            </div>

            <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pb-24 pt-1 sm:pb-6">
              {messages.map((message, index) => (
                <div
                  key={`${message.sender}-${index}`}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "bot" &&
                  !message.isStreaming &&
                  tryParseAnswer(message.text) ? (
                    <div className="w-full max-w-3xl rounded-3xl bg-muted/60 px-6 py-5 text-sm leading-relaxed text-foreground dark:text-slate-100">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                        Teacher's Answer
                      </div>
                      {(() => {
                        const parsed = tryParseAnswer(message.text);
                        if (!parsed) return <div>{message.text}</div>;
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
                                    <div key={idx} className="rounded-2xl bg-background/70 p-3">
                                      <div className="text-sm font-semibold">
                                        {step.title || `Step ${idx + 1}`}
                                      </div>
                                      {step.explanation && (
                                        <div className="mt-1 text-sm text-muted-foreground">
                                          {asText(step.explanation)}
                                        </div>
                                      )}
                                      {step.expression && (
                                        <div className="mt-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">
                                          {asText(step.expression)}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {parsed.final_answer && formatFinalAnswer(parsed.final_answer) && (
                                <div className="rounded-2xl bg-emerald-500/12 px-3 py-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
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
                              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                                {parsed.explanation.map((point, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                    <span>{asText(point)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {parsed.example && (
                              <div className="rounded-2xl bg-background/70 p-3 text-sm text-slate-800 dark:text-slate-100">
                                <span className="font-semibold">Example: </span>
                                {asText(parsed.example)}
                              </div>
                            )}
                            {parsed.summary && (
                              <div className="rounded-2xl bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-200">
                                <span className="font-semibold">Summary: </span>
                                {asText(parsed.summary)}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : message.sender === "bot" && message.isStreaming ? (
                    <div className="max-w-[75%] rounded-3xl bg-muted px-4 py-3 text-sm text-muted-foreground shadow-sm">
                      {message.text ? (
                        <span className="whitespace-pre-wrap break-words text-foreground">
                          {message.text}
                        </span>
                      ) : (
                        <span className="inline-flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:120ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:240ms]" />
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`${
                        message.sender === "bot" &&
                        (index === 0 ||
                          message.text.startsWith("Hello") ||
                          message.text.startsWith("Welcome!"))
                          ? "w-full max-w-3xl"
                          : "max-w-[75%]"
                      } whitespace-pre-wrap break-words rounded-3xl px-4 py-3 text-sm shadow-sm ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-auto border-t border-border pt-3 sm:pt-4 sticky bottom-0 bg-card/95 backdrop-blur sm:static sm:bg-transparent">
              <div className="flex items-center gap-2 flex-nowrap">
                <textarea
                      ref={inputRef}
                      value={draft}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDraft(value);
                        resizeTextarea(value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          if (sendingRef.current || isTyping) {
                            event.preventDefault();
                            return;
                          }
                          if (isListening) {
                            event.preventDefault();
                            return;
                          }
                          event.preventDefault();
                          handleSend();
                        }
                        
                      }}
                      placeholder="Ask your tutor..."
                      rows={1}
                      className="min-w-0 flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4 sm:py-3"
                    />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border shadow-sm transition ${
                      isListening
                        ? "border-blue-200 bg-blue-50"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                    title="Speak"
                    aria-pressed={isListening}
                  >
                    {isListening && (
                      <>
                        <span
                          className={`pointer-events-none absolute inset-0 rounded-2xl bg-blue-100/50 ${
                            isSpeechActive
                              ? "animate-pulse [animation-duration:300ms]"
                              : "animate-pulse [animation-duration:550ms]"
                          }`}
                        />
                        <span
                          className={`pointer-events-none absolute inset-2 rounded-xl border border-blue-200/70 ${
                            isSpeechActive
                              ? "animate-pulse [animation-duration:300ms]"
                              : "animate-pulse [animation-duration:550ms]"
                          }`}
                        />
                      </>
                    )}
                    <span
                      className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full ${
                        isListening ? "bg-blue-600" : "bg-transparent"
                      }`}
                    >
                      <Mic
                        className={`h-5 w-5 ${
                          isListening
                            ? isSpeechActive
                              ? "text-white animate-pulse [animation-duration:300ms]"
                              : "text-white animate-pulse [animation-duration:550ms]"
                            : "text-foreground"
                        }`}
                      />
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    !hasSelection || !selectedSubjectId || isListening || isTyping
                  }
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-3"
                >
                  <span>Send</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 12h15" />
                    <path d="M14 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl">
            <div className="text-lg font-semibold text-foreground">
              Switch subject?
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Switching to {pendingSubject} will clear the current chat.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setPendingSubject(null);
                }}
                className="flex-1 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  pendingSubject && confirmSubjectChange(pendingSubject)
                }
                className="flex-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorChat;
