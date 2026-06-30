import { useEffect, useState } from "react";
import { Plus, Brain, FileText, MessageSquare, Search } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  createCourse,
  getCourses,
  deleteCourse,
} from "@/services/courseApi";

const TENANTS = [
  { label: "HVAC", value: "hvac" },
  { label: "Marketing", value: "marketing" },
];


/* ---------------- STATUS NORMALIZER ---------------- */
const normalizeStatus = (status?: string) => {
  if (!status) return "draft";

  const value = status.toLowerCase();

  if (value === "draft") return "draft";
  if (value === "published") return "active";
  if (value === "active") return "active";
  if (value === "processing") return "processing";

  return "draft";
};

/* ---------------- TYPES ---------------- */
// type Course = {
//   id: string;
//   title: string;
//   description?: string;
//   status?: string;
//   syllabus?: {
//     modules?: {
//       lessons?: any[];
//     }[];
//   };
// };

type Course = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  file_count?: number;
  total_size_bytes?: number;
};

/* ---------------- COMPONENT ---------------- */
const Index = () => {
  // STATES
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("hvac");

  const APP_ID = "hvac";

  /* ---------------- FETCH COURSES ---------------- */
  const fetchCourses = async () => {
    setLoading(true);
    try {
      // const data = await getCourses(APP_ID);
      const data = await getCourses(selectedTenant);
      console.log("Courses from API:", data);
      setCourses(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  fetchCourses();
}, [selectedTenant]);


  /* ---------------- CREATE COURSE ---------------- */
  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) {
      alert("Course name is required");
      return;
    }

    try {
      await createCourse({
        title: newCourseName,
        description: "",
        app_id: selectedTenant,
        file_ids: [],
      });

      setIsCreateOpen(false);
      setNewCourseName("");
      await fetchCourses();

      alert("Course created successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to create course");
    }
  };

  /* ---------------- DELETE COURSE ---------------- */
  const handleDeleteCourse = async (courseId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmDelete) return;

    try {
      await deleteCourse(APP_ID, courseId);
      await fetchCourses();
      alert("Course deleted successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to delete course");
    }
  };

  /* ---------------- FILTER ---------------- */
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ---------------- FILE COUNT ---------------- */
  // const getFileCountFromSyllabus = (syllabus: any): number => {
  //   if (!syllabus?.modules) return 0;

  //   return syllabus.modules.reduce(
  //     (total: number, module: any) =>
  //       total + (module.lessons?.length || 0),
  //     0
  //   );
  // };
    
  const formatBytes = (bytes = 0) => {
      if (bytes === 0) return "0 KB";
      const kb = bytes / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      return `${(kb / 1024).toFixed(1)} MB`;
    };

  /* ---------------- UI ---------------- */
  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            
            {/* Title */}
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Your Knowledge Bases
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and train your AI course assistants
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              
              {/* Tenant Selector */}
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm w-full sm:w-auto"
              >
                {TENANTS.map((tenant) => (
                  <option key={tenant.value} value={tenant.value}>
                    {tenant.label}
                  </option>
                ))}
              </select>

              {/* Create Dialog */}
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full sm:w-auto">
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

                  <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCourse}
                      className="w-full sm:w-auto"
                    >
                      Create Course
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatsCard
            title="Active Courses"
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
              // const fileCount = getFileCountFromSyllabus(course.syllabus);

              return (
                <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description || ""}
                fileCount={course.file_count ?? 0}
                size={formatBytes(course.total_size_bytes)}
                status={normalizeStatus(course.status)}
                onDelete={() => handleDeleteCourse(course.id)}
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
