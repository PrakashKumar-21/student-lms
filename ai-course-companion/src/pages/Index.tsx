import { useEffect, useState } from "react";
import { Plus, Brain, FileText, MessageSquare, Search } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBoardContext } from "@/context/BoardContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { CourseStatus, normalizeCourseStatus } from "@/lib/courseStatus";
import {
  createCourse,
  getCourses,
  deleteCourse,
  updateCourseStatus,
  updateCourseName,
} from "@/services/courseApi";

/* ---------------- TYPES ---------------- */
type Course = {
  id: string;
  title: string;
  description?: string;
  status?: CourseStatus | string;
  fileCount?: number;
  sizeBytes?: number;
  syllabus?: {
    modules?: {
      lessons?: any[];
    }[];
  };
};

/* ---------------- COMPONENT ---------------- */
const Index = () => {
  // STATES
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { board, boardId, classLevel, classId, subjects } = useBoardContext();
  const classLabel = classLevel
    ? classLevel.startsWith("Class")
      ? classLevel
      : `Class ${classLevel}`
    : "Class";

  /* ---------------- FETCH COURSES ---------------- */
  const fetchCourses = async () => {
    setLoading(true);
    try {
      if (!boardId || !classId) {
        setCourses([]);
        return;
      }
      const data = await getCourses({
        board,
        classLevel,
        boardId,
        classId,
      });
      console.log("Courses from API:", data);
      setCourses(
        data.map((item: {
          id: string;
          name: string;
          status: string;
          file_count?: number;
          total_size_bytes?: number;
        }) => ({
          id: item.id,
          title: item.name,
          status: item.status,
          fileCount: item.file_count ?? 0,
          sizeBytes: item.total_size_bytes ?? 0,
        }))
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [board, boardId, classLevel, classId]);

  /* ---------------- CREATE COURSE ---------------- */
  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) {
      alert("Course name is required");
      return;
    }

    try {
      setIsMutating(true);
      if (!boardId || !classId) {
        alert("Select board and class first");
        return;
      }
      await createCourse({
        title: newCourseName,
        board_id: boardId,
        class_id: classId,
      });

      setIsCreateOpen(false);
      setNewCourseName("");
      await fetchCourses();

      alert("Course created successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to create course");
    } finally {
      setIsMutating(false);
    }
  };

  /* ---------------- DELETE COURSE ---------------- */
  const handleDeleteCourse = async (courseId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmDelete) return;

    try {
      setIsMutating(true);
      await deleteCourse(courseId);
      await fetchCourses();
      alert("Course deleted successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to delete course");
    } finally {
      setIsMutating(false);
    }
  };

  const handleToggleStatus = async (course: Course) => {
    try {
      setIsMutating(true);
      const nextStatus =
        normalizeCourseStatus(course.status) === CourseStatus.Published
          ? CourseStatus.Draft
          : CourseStatus.Published;
      await updateCourseStatus(course.id, nextStatus);
      await fetchCourses();
    } catch (error) {
      console.error(error);
      alert("Failed to update course status");
    } finally {
      setIsMutating(false);
    }
  };

  const handleRenameCourse = async (courseId: string, name: string) => {
    try {
      setIsMutating(true);
      await updateCourseName(courseId, name);
      await fetchCourses();
      alert("Course name updated");
    } catch (error) {
      console.error(error);
      alert("Failed to update course name");
    } finally {
      setIsMutating(false);
    }
  };

  /* ---------------- FILTER ---------------- */
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ---------------- FILE COUNT ---------------- */
  const getFileCount = (course: Course): number => {
    if (typeof course.fileCount === "number") return course.fileCount;
    if (!course.syllabus?.modules) return 0;
    return course.syllabus.modules.reduce(
      (total: number, module: any) =>
        total + (module.lessons?.length || 0),
      0
    );
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ---------------- UI ---------------- */
  return (
    <AppLayout>
      <div className="p-8 relative">
        {isMutating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <span className="h-2.5 w-2.5 animate-pulse-subtle rounded-full bg-primary" />
              Saving changes...
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Your Knowledge Bases
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and train your AI course assistants
            </p>
          </div>

          {/* Create Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Course
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Knowledge Base</DialogTitle>
                <DialogDescription>
                  Give your new AI course assistant a name.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Label htmlFor="courseName">Course Name</Label>
                <Input
                  id="courseName"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g., HVAC Safety 101"
                  className="mt-2"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isMutating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse} disabled={isMutating}>
                  {isMutating ? "Creating..." : "Create Course"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Board Overview */}
        <div className="card-elevated p-6 mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Selected Board</p>
              <p className="text-lg font-semibold text-foreground">{board}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="text-lg font-semibold text-foreground">
                {classLabel}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Subjects for {classLabel}
            </p>
            {subjects.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No subjects configured for this class yet.
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatsCard
            title="Total Courses"
            value={String(courses.length)}
            icon={Brain}
          />
          <StatsCard title="Documents Indexed" value="0" icon={FileText} />
          <StatsCard title="Queries Handled" value="0" icon={MessageSquare} />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>

        {/* Loading */}
        {loading && <p>Loading courses...</p>}

        {/* Course Grid */}
        {!loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const fileCount = getFileCount(course);
              const sizeLabel = formatSize(course.sizeBytes);

              return (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description || ""}
                    fileCount={fileCount}
                    size={sizeLabel}
                    status={normalizeCourseStatus(course.status)}
                    onDelete={() => handleDeleteCourse(course.id)}
                    onToggleStatus={() => handleToggleStatus(course)}
                    onRename={(name) => handleRenameCourse(course.id, name)}
                    isMutating={isMutating}
                  />
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No courses found
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "Create your first knowledge base to get started"}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
