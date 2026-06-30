import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  LayoutDashboard,
  BarChart3,
  Settings,
  ChevronDown,
  Building2,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Courses", href: "/", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

const tenants = [
  { id: "1", name: "HVAC Corp", icon: "HC" },
  { id: "2", name: "Marketing Pro", icon: "MP" },
  { id: "3", name: "Tech Academy", icon: "TA" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTenant, setCurrentTenant] = useState(tenants[0]);

  const handleLogout = () => {
    // Clear the stored token so protected routes send the user back to login.
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-gradient-to-b from-[#0f172a] via-[#0b1320] to-[#0a0f1a]">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-[0_10px_25px_-15px_rgba(99,102,241,0.9)]">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            AI Nexus
          </span>
        </div>

        <div className="px-4 py-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center gap-3 rounded-xl border border-transparent bg-sidebar-accent px-3 py-2.5 text-sidebar-foreground shadow-sm transition-colors hover:border-sidebar-border hover:bg-sidebar-accent/80">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground">
                  {currentTenant.icon}
                </span>
                <span className="flex-1 text-left text-sm font-medium truncate">
                  {currentTenant.name}
                </span>
                <ChevronDown className="h-4 w-4 text-sidebar-muted" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {tenants.map((tenant) => (
                <DropdownMenuItem
                  key={tenant.id}
                  onClick={() => setCurrentTenant(tenant)}
                  className="gap-3"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-semibold uppercase">
                    {tenant.icon}
                  </span>
                  <span>{tenant.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-3">
                <Building2 className="h-4 w-4" />
                <span>Create Workspace</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_0_0_0_1px_rgba(148,163,184,0.15)]"
                    : "text-sidebar-muted hover:-translate-y-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sidebar-accent/60">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-sidebar-foreground">
                    John Doe
                  </p>
                  <p className="text-xs text-sidebar-muted">Administrator</p>
                </div>
                <ChevronDown className="h-4 w-4 text-sidebar-muted" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="gap-3">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-auto border-t border-sidebar-border p-4">
          {/* Bottom-anchored logout for quick access on mobile-style sidebars. */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-full border border-sidebar-border bg-sidebar-accent/60 px-4 py-2 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
