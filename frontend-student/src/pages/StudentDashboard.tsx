import { useMemo, useState } from "react";

type Message = {
  sender: "bot" | "user";
  text: string;
};

const subjectsByClass: Record<string, string[]> = {
  "Class 6": ["Mathematics", "Science", "English", "Social Studies"],
  "Class 7": ["Mathematics", "Science", "English", "History", "Geography"],
  "Class 8": ["Mathematics", "Physics", "Chemistry", "Biology", "English"],
  "Class 9": ["Mathematics", "Physics", "Chemistry", "Biology", "Economics"],
  "Class 10": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"],
  "Class 11": ["Physics", "Chemistry", "Mathematics", "Computer Science", "English"],
  "Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Business Studies"],
};

const boards = ["CBSE", "ICSE", "State Board", "IGCSE"];

const StudentDashboard = () => {
  const [board, setBoard] = useState(boards[0]);
  const [className, setClassName] = useState(Object.keys(subjectsByClass)[0]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  const subjects = useMemo(() => subjectsByClass[className] ?? [], [className]);

  const handleSelectSubject = (subject: string) => {
    setSelectedSubject(subject);
    setMessages([
      { sender: "bot", text: `Welcome to ${subject}. How can I help you today?` },
    ]);
  };

  const handleSend = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: draft },
      { sender: "bot", text: "Great question. I'll guide you step by step." },
    ]);
    setDraft("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-surface-elevated">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-6 bg-sidebar px-6 py-8 text-sidebar-foreground">
          <div className="flex items-center gap-3 border-b border-sidebar-border pb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-indigo-500 text-white font-semibold">
              AI
            </div>
            <div>
              <div className="text-lg font-semibold">Student</div>
              <div className="text-xs text-sidebar-muted">Dashboard</div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-semibold text-sidebar-muted">
              Board
              <select
                value={board}
                onChange={(event) => setBoard(event.target.value)}
                className="mt-2 w-full rounded-xl border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm text-sidebar-foreground"
              >
                {boards.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-sidebar-muted">
              Class
              <select
                value={className}
                onChange={(event) => {
                  setClassName(event.target.value);
                  setSelectedSubject("");
                  setMessages([]);
                }}
                className="mt-2 w-full rounded-xl border border-sidebar-border bg-sidebar-accent px-3 py-2 text-sm text-sidebar-foreground"
              >
                {Object.keys(subjectsByClass).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">Subjects</div>
            <div className="space-y-2">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => handleSelectSubject(subject)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    selectedSubject === subject
                      ? "border border-primary/40 bg-primary/20 text-white"
                      : "bg-sidebar-accent text-sidebar-foreground hover:translate-x-1"
                  }`}
                >
                  <span>{subject}</span>
                  <span className="text-xs text-sidebar-muted">Chat</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <button
              type="button"
              className="w-full rounded-xl border border-sidebar-border px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
            >
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex flex-col gap-6 px-6 py-8">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-card px-6 py-4 shadow-sm">
            <div>
              <div className="text-lg font-semibold">Student Chat</div>
              <div className="text-sm text-muted-foreground">
                {selectedSubject
                  ? `${board} • ${className} • ${selectedSubject}`
                  : "Select a subject to begin."}
              </div>
            </div>
            <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Start Practice
            </button>
          </header>

          <section className="flex flex-1 flex-col rounded-2xl bg-card p-6 shadow-md">
            {!selectedSubject && (
              <div className="grid flex-1 place-items-center">
                <div className="max-w-sm text-center">
                  <h3 className="text-lg font-semibold">No subject selected</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Pick a class and subject from the left to open your AI tutor.
                  </p>
                </div>
              </div>
            )}

            {selectedSubject && (
              <div className="flex h-full flex-col gap-4">
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-2">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.sender}-${index}`}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          message.sender === "user"
                            ? "bg-gradient-to-br from-primary to-indigo-500 text-white"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ask your question..."
                    className="flex-1 rounded-xl border border-border px-4 py-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    className="rounded-xl bg-gradient-to-br from-primary to-indigo-500 px-6 py-3 text-sm font-semibold text-white"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
