import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  LayoutDashboard,
  Layers,
  GraduationCap,
  BadgeDollarSign,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useBoardContext } from "@/context/BoardContext";
import { clearAdminToken } from "@/services/adminAuth";

const navigation = [
  { name: "Courses", href: "/", icon: LayoutDashboard },
  { name: "Boards", href: "/boards", icon: Layers },
  { name: "Classes", href: "/classes", icon: GraduationCap },
  { name: "Subscriptions", href: "/subscriptions", icon: BadgeDollarSign },
  { name: "Users", href: "/users", icon: Users },
  // { name: "Analytics", href: "/analytics", icon: BarChart3 },
  // { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    board,
    classLevel,
    boards,
    classLevels,
    setBoard,
    setClassLevel,
  } = useBoardContext();

  const handleLogout = () => {
    clearAdminToken();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">
            LMS-Chat
          </span>
        </div>

        {/* Board + Class Selector */}
        <div className="px-4 py-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-sidebar-muted">Board</Label>
            <Select value={board} onValueChange={setBoard}>
              <SelectTrigger className="h-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((boardName) => (
                  <SelectItem key={boardName} value={boardName}>
                    {boardName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-sidebar-muted">Class</Label>
            <Select value={classLevel} onValueChange={setClassLevel}>
              <SelectTrigger className="h-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 px-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-sidebar-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    MG
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-sidebar-foreground">
                    Madan Gehlot
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
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-3 text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
