import { useState, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "error";
  vectorCount?: number;
}

interface FileUploadZoneProps {
  onFilesAdded?: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile?: (id: string) => void;
  readOnly?: boolean;
}

const fileTypeIcons: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  doc: "📝",
  pptx: "📊",
  ppt: "📊",
  txt: "📃",
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export function FileUploadZone({
  onFilesAdded,
  uploadedFiles,
  onRemoveFile,
  readOnly = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(true);
  }, [readOnly]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragging(false);
  }, [readOnly]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (readOnly) return;
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      onFilesAdded?.(files);
    },
    [onFilesAdded, readOnly]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      if (e.target.files) {
        const files = Array.from(e.target.files);
        onFilesAdded?.(files);
      }
    },
    [onFilesAdded, readOnly]
  );

  const getFileIcon = (fileName?: string): string => {
    const safeName = fileName || "";
    const ext = safeName.split(".").pop()?.toLowerCase() || "";
    return fileTypeIcons[ext] || "📄";
  };

  const getStatusBadge = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1 text-xs text-warning">
            <Loader2 className="h-3 w-3 animate-spin" />
            Indexing
          </span>
        );
      case "ready":
        return (
          <span className="text-xs text-success font-medium">Ready</span>
        );
      case "error":
        return <span className="text-xs text-destructive">Error</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragging && !readOnly
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.doc,.docx,.ppt,.pptx"
          onChange={handleFileInput}
          disabled={readOnly}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0",
            readOnly ? "cursor-not-allowed" : "cursor-pointer"
          )}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {readOnly ? "Course content is read-only" : "Drag files here to train"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {readOnly ? "Publishing locks editing" : "PDF, TXT, DOCX, PPTX supported"}
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Source Files</h4>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-card hover:bg-muted/30 transition-colors"
              >
                <span className="text-lg">{getFileIcon(file.name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    {file.vectorCount && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {file.vectorCount} chunks
                      </span>
                    )}
                  </div>
                </div>
                {getStatusBadge(file.status)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveFile?.(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

