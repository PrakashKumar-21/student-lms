import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BoardProvider } from "@/context/BoardContext";
import RequireAdmin from "@/components/auth/RequireAdmin";
import Index from "./pages/Index";
import CourseManager from "./pages/CourseManager";
import CourseSettings from "./pages/CourseSettings";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentAccount from "./pages/student/StudentAccount";
import Boards from "./pages/Boards";
import Classes from "./pages/Classes";
import Subscriptions from "./pages/Subscriptions";
import Users from "./pages/Users";
import AdminLogin from "./pages/AdminLogin";




const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BoardProvider>
        <BrowserRouter>
          <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/"
                element={
                  <RequireAdmin>
                    <Index />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <RequireAdmin>
                    <Index />
                  </RequireAdmin>
                }
              />
              <Route
                path="/boards"
                element={
                  <RequireAdmin>
                    <Boards />
                  </RequireAdmin>
                }
              />
              <Route
                path="/classes"
                element={
                  <RequireAdmin>
                    <Classes />
                  </RequireAdmin>
                }
              />
              <Route
                path="/subscriptions"
                element={
                  <RequireAdmin>
                    <Subscriptions />
                  </RequireAdmin>
                }
              />
              <Route
                path="/users"
                element={
                  <RequireAdmin>
                    <Users />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/courses/:id/edit"
                element={
                  <RequireAdmin>
                    <CourseManager mode="edit" />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/courses/:id/view"
                element={
                  <RequireAdmin>
                    <CourseManager mode="view" />
                  </RequireAdmin>
                }
              />
              <Route
                path="/course/:id"
                element={
                  <RequireAdmin>
                    <CourseManager />
                  </RequireAdmin>
                }
              />
              <Route
                path="/course/:id/settings"
                element={
                  <RequireAdmin>
                    <CourseSettings />
                  </RequireAdmin>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RequireAdmin>
                    <Analytics />
                  </RequireAdmin>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAdmin>
                    <Settings />
                  </RequireAdmin>
                }
              />
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/courses" element={<StudentCourses/>} />
              <Route path="/student/notifications" element={<StudentNotifications />} />
              <Route path="/student/account" element={<StudentAccount />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
          </Routes>

        </BrowserRouter>
      </BoardProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
