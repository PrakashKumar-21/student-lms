import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentLogin from "./pages/StudentLogin";
import StudentSubscription from "./pages/StudentSubscription";
import BoardClassSelection from "./pages/BoardClassSelection";
import TutorChat from "./pages/TutorChat";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/onboarding" element={<StudentSubscription />} />
          <Route path="/subscription" element={<StudentSubscription />} />
          <Route path="/select" element={<BoardClassSelection />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <TutorChat />
              </ProtectedRoute>
                
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
