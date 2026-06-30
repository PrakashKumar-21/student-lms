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
  Settings,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourseCardProps {
  id: string;
  title: string;
  description?: string;
  fileCount: number;
  size?: string;
  status: "active" | "processing" | "draft";
  vectorCount?: number;
  onDelete?: () => void;
}

const statusConfig = {
  active: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20",
  },
  processing: {
    label: "Processing",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function CourseCard({
  id,
  title,
  description,
  fileCount,
  size = "0 KB",
  status,
  vectorCount,
  onDelete,
}: CourseCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <div className="group card-elevated p-5 hover:border-primary/30 transition-all duration-200 animate-fade-in">
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
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/course/${id}/settings`} className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="gap-2 text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.();
              }}
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

      <div className="flex items-center justify-between">
        <Badge variant="outline" className={statusInfo.className}>
          {statusInfo.label}
        </Badge>

        <Button variant="outline" size="sm" asChild>
          <Link to={`/course/${id}`}>Manage</Link>
        </Button>
      </div>
    </div>
  );
}
