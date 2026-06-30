import { useEffect, useState } from "react";
import { Brain, ChevronLeft, ChevronRight, Crown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SubjectOption = { name: string };

interface StudentSidebarProps {
  isMobile: boolean;
  isSidebarOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onExpand: () => void;
  selectedBoard: string;
  selectedClass: string;
  selectedSubject: string;
  availableBoards: string[];
  availableClasses: string[];
  availableSubjects: SubjectOption[];
  isLoadingSubjects: boolean;
  onBoardChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSubjectSelect: (value: string) => void;
  onLogout: () => void;
}

export function StudentSidebar({
  isMobile,
  isSidebarOpen,
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
  onExpand,
  selectedBoard,
  selectedClass,
  selectedSubject,
  availableBoards,
  availableClasses,
  availableSubjects,
  isLoadingSubjects,
  onBoardChange,
  onClassChange,
  onSubjectSelect,
  onLogout,
}: StudentSidebarProps) {
  const navigate = useNavigate();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  const handleUpgrade = () => {
    navigate("/subscription");
  };

  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!token) {
      setAccountEmail(null);
      return;
    }
    let isMounted = true;
    fetch(`${API_BASE_URL}/api/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        setAccountEmail(data?.phone_or_email ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setAccountEmail(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const accountLabel = accountEmail || "Account";
  const displayName =
    accountEmail && accountEmail.includes("@")
      ? accountEmail.split("@")[0]
      : accountLabel;

  return (
    <aside
      className={`${
        isMobile
          ? `fixed left-0 top-0 z-50 h-full w-[82vw] max-w-xs rounded-r-3xl p-5 shadow-2xl transition-transform duration-300 ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`
          : `relative h-full rounded-3xl shadow-[0_20px_40px_-30px_rgba(15,23,42,0.9)] ${
              isCollapsed ? "w-20 p-3" : "w-full sm:w-72 p-5"
            }`
      } flex flex-col gap-6 border border-[#101827] bg-gradient-to-b from-[#0f172a] via-[#0b1320] to-[#0a0f1a]`}
    >
      <div className={`flex items-center ${isCollapsed ? "flex-col gap-4" : "justify-between"}`}>
        <div className={`flex items-center ${isCollapsed ? "flex-col gap-3" : "gap-3"}`}>
          {/* <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-[0_12px_24px_-14px_rgba(99,102,241,0.9)]">
            <Brain className="h-4 w-4" />
          </div> */}
          {!isCollapsed && (
            <div>
              <div className="text-lg font-semibold text-white">
                Tutor Hub
              </div>
              <div className="text-xs text-slate-400">
                Class 1-12
              </div>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`rounded-full grid h-8 w-8 place-items-center bg-primary text-white shadow-[0_12px_24px_-14px_rgba(99,102,241,0.9)]  ${
              isCollapsed ? "h-10 w-10" : ""
            }`}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-300 shadow-sm transition hover:-translate-y-0.5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close sidebar"
          >
            Close
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {isCollapsed && !isMobile ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={onExpand}
              className="flex w-full flex-col items-center gap-1 rounded-2xl border border-slate-800/60 bg-slate-900/60 px-2 py-3 text-slate-100 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.06)] transition hover:bg-slate-900"
              title={`Board: ${selectedBoard || "Not selected"}`}
              aria-label={`Board selected: ${selectedBoard || "Not selected"}. Click to expand sidebar.`}
            >
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                Board
              </span>
              <span className="w-full truncate text-center text-sm font-semibold">
                {selectedBoard || "Select"}
              </span>
            </button>
            <button
              type="button"
              onClick={onExpand}
              className="flex w-full flex-col items-center gap-1 rounded-2xl border border-slate-800/60 bg-slate-900/60 px-2 py-3 text-slate-100 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.06)] transition hover:bg-slate-900"
              title={`Class: ${selectedClass || "Not selected"}`}
              aria-label={`Class selected: ${selectedClass || "Not selected"}. Click to expand sidebar.`}
            >
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                Class
              </span>
              <span className="w-full truncate text-center text-sm font-semibold">
                {selectedClass || "Select"}
              </span>
            </button>
            <button
              type="button"
              onClick={onExpand}
              className="flex w-full flex-col items-center gap-1 rounded-2xl border border-slate-800/60 bg-slate-900/60 px-2 py-3 text-slate-100 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.06)] transition hover:bg-slate-900"
              title={`Subject: ${selectedSubject || "Not selected"}`}
              aria-label={`Subject selected: ${selectedSubject || "Not selected"}. Click to expand sidebar.`}
            >
              <span className="text-[10px] uppercase tracking-wide text-slate-500">
                Subject
              </span>
              <span className="w-full truncate text-center text-sm font-semibold">
                {selectedSubject || "Select"}
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400">
                Board
              </label>
              <Select value={selectedBoard} onValueChange={onBoardChange}>
                <SelectTrigger className="mt-2 h-12 rounded-2xl border-slate-800 bg-slate-900/70 text-slate-100 focus:ring-primary">
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                  {availableBoards.map((board) => (
                    <SelectItem key={board} value={board}>
                      {board}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">
                Class
              </label>
              <Select
                value={selectedClass}
                onValueChange={onClassChange}
                disabled={!selectedBoard}
              >
                <SelectTrigger className="mt-2 h-12 rounded-2xl border-slate-800 bg-slate-900/70 text-slate-100 focus:ring-primary disabled:opacity-60">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                  {availableClasses.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">
                Subject
              </label>
              <Select
                value={selectedSubject}
                onValueChange={onSubjectSelect}
                disabled={!selectedBoard || !selectedClass}
              >
                <SelectTrigger className="mt-2 h-12 rounded-2xl border-slate-800 bg-slate-900/70 text-slate-100 focus:ring-primary disabled:opacity-60">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
                  {isLoadingSubjects && (
                    <SelectItem value="loading" disabled>
                      Loading subjects...
                    </SelectItem>
                  )}
                  {!isLoadingSubjects && availableSubjects.length === 0 && (
                    <SelectItem value="none" disabled>
                      {selectedBoard && selectedClass
                        ? "No active subjects yet"
                        : "Select board and class"}
                    </SelectItem>
                  )}
                  {availableSubjects.map((subjectItem) => (
                    <SelectItem
                      key={subjectItem.name}
                      value={subjectItem.name}
                    >
                      {subjectItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div
          className={`mt-auto pt-4 border-t border-slate-800 ${
            isCollapsed && !isMobile ? "flex justify-center" : ""
          }`}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`flex items-center rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-900 ${
                  isCollapsed ? "h-12 w-12 justify-center px-0" : "w-full gap-2"
                }`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-slate-200">
                  {displayName ? displayName.slice(0, 1).toUpperCase() : "A"}
                </div>
                {!isCollapsed && <span className="truncate">Go</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isCollapsed ? "center" : "start"}
              className="min-w-[240px] rounded-2xl border border-slate-800 bg-[#1f2430] p-2 text-slate-100 shadow-2xl"
            >
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
                  {displayName ? displayName.slice(0, 1).toUpperCase() : "A"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {displayName || "Account"}
                  </p>
                  {accountLabel !== "Account" && (
                    <p className="truncate text-xs text-slate-400">
                      {accountLabel}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator className="my-1 bg-slate-700/70" />
              <DropdownMenuItem
                className="gap-2 rounded-lg px-3 py-2 focus:bg-slate-800"
                onClick={handleUpgrade}
              >
                <Crown className="h-4 w-4 text-amber-400" />
                Upgrade plan
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-700/70" />
              <DropdownMenuItem
                className="gap-2 rounded-lg px-3 py-2 text-red-300 focus:bg-slate-800"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
