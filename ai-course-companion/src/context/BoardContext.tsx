import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getBoards, type Board } from "@/services/boardApi";
import { getClasses, type ClassLevel } from "@/services/classApi";
import { getSubjects } from "@/services/subjectApi";

const fallbackBoards: Board[] = [];

type BoardContextValue = {
  board: string;
  boardId: string;
  classLevel: string;
  classId: string;
  boards: string[];
  classLevels: string[];
  subjects: string[];
  setBoard: (value: string) => void;
  setClassLevel: (value: string) => void;
};

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [boardOptions, setBoardOptions] = useState<Board[]>(fallbackBoards);
  const [board, setBoard] = useState(boardOptions[0]?.name ?? "");
  const [classOptions, setClassOptions] = useState<ClassLevel[]>([]);
  const [classLevel, setClassLevel] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);

  const boards = useMemo(
    () => boardOptions.map((item) => item.name),
    [boardOptions]
  );
  const classLevels = useMemo(
    () => classOptions.map((item) => item.name),
    [classOptions]
  );
  const selectedBoard = useMemo(
    () => boardOptions.find((item) => item.name === board) ?? boardOptions[0],
    [boardOptions, board]
  );
  const selectedClass = useMemo(
    () =>
      classOptions.find((item) => item.name === classLevel) ??
      classOptions[0],
    [classOptions, classLevel]
  );
  const boardId = selectedBoard?.id ?? "";
  const classId = selectedClass?.id ?? "";

  useEffect(() => {
    let mounted = true;
    async function loadBoards() {
      try {
        const data = await getBoards({ includeInactive: true });
        if (!mounted) {
          return;
        }
        // console.log("Boards API response:", data);
        if (data.length > 0) {
          setBoardOptions(data);
          setBoard((current) =>
            current && data.some((item) => item.name === current)
              ? current
              : data[0].name
          );
        }
      } catch (error) {
        console.error("Failed to load boards", error);
      }
    }
    loadBoards();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadClasses() {
      if (!selectedBoard?.name) {
        setClassOptions([]);
        setClassLevel("");
        setSubjects([]);
        return;
      }
      try {
        const data = await getClasses({
          board: selectedBoard.name,
          boardId: selectedBoard.id || undefined,
          includeInactive: true,
        });
        // console.log("Classes API response:", data);
        if (!mounted) {
          return;
        }
        setClassOptions(data);
        if (data.length === 0) {
          setClassLevel("");
        } else {
          setClassLevel((current) =>
            current && data.some((item) => item.name === current)
              ? current
              : data[0].name
          );
        }
      } catch (error) {
        console.error("Failed to load classes", error);
        if (mounted) {
          setClassOptions([]);
          setClassLevel("");
          setSubjects([]);
        }
      }
    }
    loadClasses();
    return () => {
      mounted = false;
    };
  }, [selectedBoard]);

  useEffect(() => {
    let mounted = true;
    async function loadSubjects() {
      if (!selectedBoard?.name || !selectedClass?.name) {
        setSubjects([]);
        return;
      }
      try {
        const data = await getSubjects({
          board: selectedBoard.name,
          classLevel: selectedClass.name,
          boardId: selectedBoard.id || undefined,
          classId: selectedClass.id || undefined,
        });
        // console.log("Subjects API response:", data);
        if (!mounted) {
          return;
        }
        setSubjects(data.map((item) => item.name));
      } catch (error) {
        console.error("Failed to load subjects", error);
        if (mounted) {
          setSubjects([]);
        }
      }
    }
    loadSubjects();
    return () => {
      mounted = false;
    };
  }, [selectedBoard, selectedClass]);

  const value = useMemo(
    () => ({
      board,
      boardId,
      classLevel,
      classId,
      boards,
      classLevels,
      subjects,
      setBoard,
      setClassLevel,
    }),
    [board, boardId, classLevel, classId, boards, classLevels, subjects]
  );

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const context = useContext(BoardContext);

  if (!context) {
    throw new Error("useBoardContext must be used within BoardProvider");
  }

  return context;
}
