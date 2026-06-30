import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import ClassSelect from "@/components/ClassSelect";
import { AppHeader } from "@/components/layout/AppHeader";
import selectionBanner from "@/assets/selection-banner.svg";
import { getBoards, type Board } from "@/services/boardApi";
import { getClasses, type ClassLevel } from "@/services/classApi";

const BoardClassSelection = () => {
  const navigate = useNavigate();
  const storedSelection = (() => {
    try {
      const raw = localStorage.getItem("tutor-selection");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const [selectedBoard, setSelectedBoard] = useState(
    () => storedSelection?.board ?? "",
  );
  const [selectedClass, setSelectedClass] = useState(
    () => storedSelection?.class ?? "",
  );
  const [boards, setBoards] = useState<Board[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [error, setError] = useState("");

  const selectedBoardMeta = useMemo(
    () => boards.find((board) => board.name === selectedBoard),
    [boards, selectedBoard],
  );
  const selectedClassMeta = useMemo(
    () => classes.find((item) => item.name === selectedClass),
    [classes, selectedClass],
  );

  const canContinue = useMemo(
    () => Boolean(selectedBoard && selectedClass),
    [selectedBoard, selectedClass],
  );

  const classOptions = useMemo(
    () => classes.map((item) => item.name),
    [classes],
  );

  const loadBoards = async () => {
    try {
      const data = await getBoards();
      console.log(data);
      setBoards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load boards");
    }
  };

  const loadClasses = async (board: Board) => {
    try {
      const data = await getClasses({
        board: board.name,
        boardId: board.id,
      });
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load classes");
      setClasses([]);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (!selectedBoardMeta) {
      setClasses([]);
      setSelectedClass("");
      return;
    }
    loadClasses(selectedBoardMeta);
  }, [selectedBoardMeta]);

  // const handleContinue = () => {
  //   if (!canContinue) return;
  //   const params = new URLSearchParams({
  //     board: selectedBoard,
  //     class: selectedClass,
  //   });
  //   if (selectedBoardMeta?.id) {
  //     params.set("board_id", selectedBoardMeta.id);
  //   }
  //   if (selectedClassMeta?.id) {
  //     params.set("class_id", selectedClassMeta.id);
  //   }
  //   navigate(`/chat?${params.toString()}`);
  // };

  const handleContinue = () => {
    if (!canContinue) return;

    const nextSelection = {
      board: selectedBoard,
      class: selectedClass,
      board_id: selectedBoardMeta?.id ?? "",
      class_id: selectedClassMeta?.id ?? "",
    };

    localStorage.setItem("tutor-selection", JSON.stringify(nextSelection));

    const params = new URLSearchParams({
      board: selectedBoard,
      class: selectedClass,
    });
    if (selectedBoardMeta?.id) params.set("board_id", selectedBoardMeta.id);
    if (selectedClassMeta?.id) params.set("class_id", selectedClassMeta.id);

    navigate(`/chat?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#ffffff_45%,_#f5f7ff_100%)]">
      <AppHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pt-3 pb-5">
        <header className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 px-6 py-3 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-blue-400/30 via-indigo-400/20 to-transparent blur-2xl" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* <BackButton to="/subscription" /> */}
            {/* <div></div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500/70">
              Step 1 of 2
            </div> */}
          </div>
          <div className="relative flex flex-wrap items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-[0_12px_30px_-18px_rgba(79,70,229,0.9)]">
              <span className="text-lg font-semibold">AI</span>
            </div>
            <div>
              <div className="text-2xl font-bold md:text-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Pick your board & class
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Unlock subjects curated for your syllabus and learning pace.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-500">Boards</div>
              {selectedBoard && (
                <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  Selected: {selectedBoard}
                </div>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {boards.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {error || "No boards available yet."}
                </div>
              )}
              {boards.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => setSelectedBoard(board.name)}
                  className={`group relative overflow-hidden rounded-2xl border px-5 py-6 text-left transition ${
                    selectedBoard === board.name
                      ? "border-indigo-400/70 bg-gradient-to-br from-indigo-500/10 via-white to-white shadow-[0_16px_30px_-24px_rgba(79,70,229,0.7)]"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                  }`}
                >
                  <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/10 blur-xl" />
                  <div className="relative text-lg font-semibold text-slate-900">
                    {board.name}
                  </div>
                  <div className="relative mt-4 text-xs font-semibold text-indigo-600 opacity-0 transition group-hover:opacity-100">
                    Select board →
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-500">
                Classes
              </div>
              {selectedClass && (
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  {selectedClass}
                </div>
              )}
            </div>
            <div className="mt-4">
              <ClassSelect
                label="Select your class"
                options={classOptions}
                value={selectedClass}
                onChange={setSelectedClass}
                disabled={!selectedBoard}
                placeholder={
                  selectedBoard ? "Choose class" : "Select board first"
                }
              />
            </div>
            <div className="mt-6 rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-indigo-50 to-sky-50 p-4">
              {/* <img
                src={selectionBanner}
                alt="Choose your board and class"
                className="h-56 w-full rounded-xl object-cover"
                loading="lazy"
              /> */}
              <div className="mt-4 text-xs text-slate-500">
                Tip: Choose the class you are currently studying to get accurate
                help.
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-center gap-2 rounded-3xl border border-slate-100 bg-white/90 px-6 py-5 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.3)]">
          {!canContinue ? (
            <div className="text-xs text-slate-500">
              Select both a board and class to continue.
            </div>
          ) : (
            <div className="text-sm font-semibold text-emerald-600">
              Ready! Your subjects are waiting.
            </div>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full max-w-md rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              canContinue
                ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-[0_16px_30px_-18px_rgba(37,99,235,0.7)] hover:-translate-y-0.5"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            }`}
          >
            Continue to Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardClassSelection;
