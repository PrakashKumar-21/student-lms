import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";

type AppHeaderProps = {
  showThemeToggle?: boolean;
  showTagline?: boolean;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
};

export function AppHeader({
  showThemeToggle = false,
  showTagline = true,
  theme = "light",
  onToggleTheme,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
      <Link to="/" className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-sm font-semibold text-white shadow-[0_10px_24px_-14px_rgba(59,130,246,0.8)]">
          SL
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-foreground">Super-LMS</div>
          {/* <div className="text-[11px] text-slate-500">Student Portal</div> */}
        </div>
      </Link>
      <div className="flex items-center gap-3">
        {showThemeToggle && (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        )}
        {showTagline && (
          <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Learn with confidence
          </div>
        )}
      </div>
    </header>
  );
}
