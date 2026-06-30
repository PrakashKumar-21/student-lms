import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { FileUploadZone } from "@/components/course/FileUploadZone";
import { ChatSimulator } from "@/components/course/ChatSimulator";
import { Button } from "@/components/ui/button";

import { getCourseDetails, attachFilesToCourse } from "@/services/courseApi";
import { uploadFile } from "@/services/fileApi";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "error";
  vectorCount?: number;
}


const CourseManager = () => {
  const [courseName, setCourseName] = useState<string>("");
  // get ID from URL
  const { id } = useParams<{ id: string }>();
  const appId = "hvac";

  const [files, setFiles] = useState<UploadedFile[]>([]);

  // Fetch files for this course
  useEffect(() => {
    if (!id) return;

    getCourseDetails(appId, id).then((data) => {
    console.log("Course details API response:", data);
    console.log("Files from backend:", data.files);
    setCourseName(data.title);
      const mapped = data.files.map((f: any) => ({
      id: f.id,
      name: f.filename,
      type: f.filename.split(".").pop(),
      size: f.file_size_bytes || 0,
      status: f.status?.toLowerCase() || "processing",
      vectorCount: f.chunk_count || 0,
    }));


      setFiles(mapped);
    });
  }, [id]);

  //  Upload & attach files
  const handleFilesAdded = async (newFiles: File[]) => {
    if (!id) return;

    for (const file of newFiles) {
      const tempId = `temp-${Date.now()}`;

      // show uploading
      setFiles((prev) => [
        ...prev,
        {
          id: tempId,
          name: file.name,
          type: file.name.split(".").pop() || "unknown",
          size: file.size,
          status: "uploading",
        },
      ]);

      try {
        // upload
        const uploaded = await uploadFile(appId, file);
  
        // attach to course
        await attachFilesToCourse(appId, id, [uploaded.file_id]);

        // mark processing
        setFiles((prev) =>
          prev.map((f) =>
            f.id === tempId
              ? { ...f, id: uploaded.file_id, status: "processing" }
              : f
          )
        );

        // simulate indexing done
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploaded.file_id
                ? { ...f, status: "ready" }
                : f
            )
          );
        }, 3000);
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === tempId ? { ...f, status: "error" } : f
          )
        );
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            {/* <div>
              <h1 className="text-xl font-semibold">
                Course Manager
              </h1>
              <p className="text-sm text-muted-foreground">
                Course ID: {id}
              </p>
            </div> */}
            <h1 className="text-xl font-semibold">
            {courseName}
            </h1>

          </div>
          <Button variant="outline" asChild>
            <Link to={`/course/${id}/settings`} className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          <div className="w-2/5 border-r p-6 overflow-y-auto">
            <FileUploadZone
              uploadedFiles={files}
              onFilesAdded={handleFilesAdded}
              onRemoveFile={handleRemoveFile}
            />
          </div>

          <div className="flex-1 p-6">
            <ChatSimulator courseName="Course" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CourseManager;
