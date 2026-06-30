// import { Brain, FileText, HardDrive, MoreVertical, Settings, Trash2 } from "lucide-react";
// import { Link } from "react-router-dom";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// interface CourseCardProps {
//   id: string;
//   title: string;
//   description?: string;
//   fileCount: number;
//   size: string;
//   status: "active" | "processing" | "draft";
//   vectorCount?: number;
// }

// const statusConfig = {
//   active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
//   processing: { label: "Processing", className: "bg-warning/10 text-warning border-warning/20" },
//   draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
// };

// export function CourseCard({
//   id,
//   title,
//   description,
//   fileCount,
//   size,
//   status,
//   vectorCount,
// }: CourseCardProps) {
//   const statusInfo = statusConfig[status];

//   return (
//     <div className="group card-elevated p-5 hover:border-primary/30 transition-all duration-200 animate-fade-in">
//       <div className="flex items-start justify-between mb-4">
//         <div className="flex items-center gap-3">
//           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
//             <Brain className="h-5 w-5 text-primary" />
//           </div>
//           <div>
//             <h3 className="font-semibold text-foreground">{title}</h3>
//             {description && (
//               <p className="text-sm text-muted-foreground line-clamp-1">
//                 {description}
//               </p>
//             )}
//           </div>
//         </div>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
//             >
//               <MoreVertical className="h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem asChild>
//               <Link to={`/course/${id}/settings`} className="gap-2">
//                 <Settings className="h-4 w-4" />
//                 Settings
//               </Link>
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem className="gap-2 text-destructive">
//               <Trash2 className="h-4 w-4" />
//               Delete
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
//         <div className="flex items-center gap-1.5">
//           <FileText className="h-4 w-4" />
//           <span>{fileCount} Files</span>
//         </div>
//         <div className="flex items-center gap-1.5">
//           <HardDrive className="h-4 w-4" />
//           <span>{size}</span>
//         </div>
//         {vectorCount && (
//           <div className="text-xs bg-muted px-2 py-0.5 rounded">
//             {vectorCount.toLocaleString()} vectors
//           </div>
//         )}
//       </div>

//       <div className="flex items-center justify-between">
//         <Badge variant="outline" className={statusInfo.className}>
//           {statusInfo.label}
//         </Badge>
//         <Button variant="outline" size="sm" asChild>
//           <Link to={`/course/${id}`}>Manage</Link>
//         </Button>
//       </div>
//     </div>
//   );
// }


import {
  Brain,
  FileText,
  HardDrive,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CourseStatus,
  getCourseRouteByMode,
  getCourseStatusBadge,
} from "@/lib/courseStatus";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface CourseCardProps {
  id: string;
  title: string;
  description?: string;
  fileCount: number;
  size?: string;
  status: CourseStatus;
  vectorCount?: number;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  onRename?: (name: string) => void;
  isMutating?: boolean;
}

export function CourseCard({
  id,
  title,
  description,
  fileCount,
  size = "0 KB",
  status,
  vectorCount,
  onDelete,
  onToggleStatus,
  onRename,
  isMutating = false,
}: CourseCardProps) {
  const statusInfo = getCourseStatusBadge(status);
  const navigate = useNavigate();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(title);

  const handleOpen = () => {
    navigate(getCourseRouteByMode(id, "edit"));
  };

  const handleRenameOpen = () => {
    setRenameValue(title);
    setIsRenameOpen(true);
  };

  const handleRenameSave = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      alert("Course name is required");
      return;
    }
    onRename?.(trimmed);
    setIsRenameOpen(false);
  };

  return (
    <div
      className="group card-elevated p-5 hover:border-primary/30 transition-all duration-200 animate-fade-in cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {description}
              </p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(event) => event.stopPropagation()}
              disabled={isMutating}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="gap-2"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleRenameOpen();
              }}
              disabled={isMutating}
            >
              <Pencil className="h-4 w-4" />
              Rename
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="gap-2 text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.();
              }}
              disabled={isMutating}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          <span>{fileCount} Files</span>
        </div>

        <div className="flex items-center gap-1.5">
          <HardDrive className="h-4 w-4" />
          <span>{size}</span>
        </div>

        {vectorCount && (
          <div className="text-xs bg-muted px-2 py-0.5 rounded">
            {vectorCount.toLocaleString()} vectors
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={statusInfo.className}>
          {statusInfo.label}
        </Badge>

        {onToggleStatus ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onToggleStatus();
            }}
            disabled={isMutating}
          >
            {status === CourseStatus.Published ? "Draft" : "Activate"}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={(event) => {
            event.stopPropagation();
            handleOpen();
          }}
          disabled={isMutating}
        >
          Manage
        </Button>
      </div>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rename subject</DialogTitle>
            <DialogDescription>
              Update the subject name shown to students.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder="Enter subject name"
              disabled={isMutating}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleRenameSave();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameOpen(false)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameSave} disabled={isMutating}>
              {isMutating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

