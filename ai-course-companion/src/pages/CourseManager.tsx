import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FileUploadZone } from "@/components/course/FileUploadZone";
import { ChatSimulator } from "@/components/course/ChatSimulator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CourseStatus, normalizeCourseStatus } from "@/lib/courseStatus";
import { getCourse, updateCourseStatus } from "@/services/courseApi";
import {
  deleteSubjectFile,
  getSubjectFiles,
  uploadSubjectFile,
} from "@/services/fileApi";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "error";
  vectorCount?: number;
}

type CourseManagerProps = {
  mode?: "edit" | "view";
};

const CourseManager = ({ mode }: CourseManagerProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [courseStatus, setCourseStatus] = useState<CourseStatus | null>(null);
  const [courseName, setCourseName] = useState("Subject");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMovingToDraft, setIsMovingToDraft] = useState(false);
  const isStatusReady = courseStatus !== null;
  const isAdminView = mode === "edit" || mode === "view";
  const isReadOnly = false;
  const showActiveWarning = courseStatus === CourseStatus.Published;

  const handleFilesAdded = async (newFiles: File[]) => {
    if (!id) return;
    const tempFiles = newFiles.map((file, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      name: file.name,
      type: file.name.split(".").pop() || "unknown",
      size: file.size,
      status: "uploading" as const,
    }));
    setFiles((prev) => [...prev, ...tempFiles]);

    await Promise.all(
      tempFiles.map(async (fileMeta, idx) => {
        const file = newFiles[idx];
        try {
          setFiles((prev) =>
            prev.map((item) =>
              item.id === fileMeta.id
                ? { ...item, status: "processing" as const }
                : item
            )
          );
          const result = await uploadSubjectFile(id, file);
          const uploaded = result.file;
          setFiles((prev) =>
            prev.map((item) =>
              item.id === fileMeta.id
                ? {
                    ...item,
                    id: uploaded.id,
                    name: uploaded.original_name,
                    type: uploaded.original_name.split(".").pop() || "unknown",
                    size: uploaded.size_bytes,
                    status: "ready" as const,
                  }
                : item
            )
          );
        } catch (error) {
          console.error("Upload failed", error);
          setFiles((prev) =>
            prev.map((item) =>
              item.id === fileMeta.id
                ? { ...item, status: "error" as const }
                : item
            )
          );
        }
      })
    );
  };

  const handleRemoveFile = async (fileId: string) => {
    if (!id) return;
    const confirmed = window.confirm(
      "Delete this file? This will remove it from the subject."
    );
    if (!confirmed) {
      return;
    }
    const target = files.find((item) => item.id === fileId);
    if (!target || target.id.startsWith("new-")) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      return;
    }
    try {
      await deleteSubjectFile(id, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      console.error("Failed to delete file", error);
      toast({
        title: "Delete failed",
        description: "Unable to delete file. Try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadCourse = async () => {
      try {
        const course = await getCourse(id);
        if (!isMounted) return;
        setCourseStatus(normalizeCourseStatus(course?.status));
        setCourseName(course?.name || "Subject");
        const fileData = await getSubjectFiles(id);
        if (!isMounted) return;
        setFiles(
          fileData.map((item) => ({
            id: item.id,
            name: item.original_name,
            type: item.original_name.split(".").pop() || "unknown",
            size: item.size_bytes,
            status: "ready" as const,
          }))
        );
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setCourseStatus(CourseStatus.Draft);
        }
      }
    };

    loadCourse();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id || mode || !courseStatus) return;
    if (courseStatus === CourseStatus.Draft) {
      navigate("/404", { replace: true });
    }
  }, [courseStatus, id, mode, navigate]);

  const handlePublish = async () => {
    if (!id) return;

    setIsPublishing(true);
    setCourseStatus(CourseStatus.Published);

    try {
      await updateCourseStatus(id, CourseStatus.Published);
      toast({ title: "Course Published" });
    } catch (error) {
      console.error(error);
      setCourseStatus(CourseStatus.Draft);
      toast({
        title: "Activation failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleMoveToDraft = async () => {
    if (!id) return;

    setIsMovingToDraft(true);
    setCourseStatus(CourseStatus.Draft);

    try {
      await updateCourseStatus(id, CourseStatus.Draft);
      toast({ title: "Course moved to Draft" });
    } catch (error) {
      console.error(error);
      setCourseStatus(CourseStatus.Published);
      toast({
        title: "Move failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMovingToDraft(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {courseName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Course ID: {id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdminView && courseStatus === CourseStatus.Draft && (
              <>
                <Button
                  onClick={handlePublish}
                  disabled={
                    !isStatusReady ||
                    isPublishing
                  }
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </Button>
              </>
            )}
            {isAdminView && courseStatus === CourseStatus.Published && (
              <Button
                variant="secondary"
                onClick={handleMoveToDraft}
                disabled={isMovingToDraft}
              >
                {isMovingToDraft ? "Moving..." : "Regenerate"}
              </Button>
            )}
          </div>
        </div>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Knowledge Sources */}
          <div className="w-2/5 border-r border-border p-6 overflow-y-auto bg-card">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Source Material
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload documents to train your AI assistant
              </p>
              {showActiveWarning && (
                <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                  This subject is active. Uploading new files will update the live
                  content.
                </div>
              )}
            </div>
            <FileUploadZone
              uploadedFiles={files}
              onFilesAdded={handleFilesAdded}
              onRemoveFile={handleRemoveFile}
              readOnly={isReadOnly}
            />
          </div>

          {/* Right Panel - Simulator */}
          <div className="flex-1 p-6 bg-surface-elevated overflow-hidden">
            <ChatSimulator courseName={courseName} subjectId={id} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CourseManager;
