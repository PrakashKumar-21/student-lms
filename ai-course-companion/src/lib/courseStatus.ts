export const ADMIN_COURSES_BASE_PATH = "/admin/courses";

export enum CourseStatus {
  Draft = "DRAFT",
  Published = "PUBLISHED",
}

export type CourseRouteMode = "edit" | "view";

const STATUS_BADGE = {
  [CourseStatus.Draft]: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
  },
  [CourseStatus.Published]: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20",
  },
} as const;

export const normalizeCourseStatus = (status?: string): CourseStatus => {
  if (!status) return CourseStatus.Draft;

  const value = status.toUpperCase();
  if (value === CourseStatus.Published || value === "ACTIVE") {
    return CourseStatus.Published;
  }

  return CourseStatus.Draft;
};

export const getCourseStatusBadge = (status: CourseStatus) => STATUS_BADGE[status];

export const getCourseRouteByStatus = (subjectId: string, status: CourseStatus) => {
  const mode: CourseRouteMode =
    status === CourseStatus.Published ? "view" : "edit";
  return `${ADMIN_COURSES_BASE_PATH}/${subjectId}/${mode}`;
};

export const getCourseRouteByMode = (subjectId: string, mode: CourseRouteMode) =>
  `${ADMIN_COURSES_BASE_PATH}/${subjectId}/${mode}`;
