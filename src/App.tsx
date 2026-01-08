import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LeaveRequestProvider } from "@/context/LeaveRequestContext";
import { HolidayProvider } from "@/context/HolidayContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { ApplyLeave } from "./pages/ApplyLeave";
import { MyLeaves } from "./pages/MyLeaves";
import { LeaveDetail } from "./pages/LeaveDetail";
import { Approvals } from "./pages/Approvals";
import { Employees } from "./pages/Employees";
import { Company } from "./pages/Company";
import { Departments } from "./pages/Departments";
import { RolesPermissions } from "./pages/RolesPermissions";
import { Roles } from "./pages/Roles";
import { Designations } from "./pages/Designations";
import { LeaveTypes } from "./pages/LeaveTypes";
import { LeavePolicies } from "./pages/LeavePolicies";
import { Reports } from "./pages/Reports";
import { EmailConfiguration } from "./pages/EmailConfiguration";
import { LeaveNotificationRules } from "./pages/LeaveNotificationRules";
import { HolidayConfiguration } from "./pages/HolidayConfiguration";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LeaveRequestProvider>
        <HolidayProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/" element={<ProtectedRoute requiredPermission="view_dashboard"><Dashboard /></ProtectedRoute>} />
                <Route path="/apply-leave" element={<ProtectedRoute requiredPermission="apply_leave"><ApplyLeave /></ProtectedRoute>} />
                <Route path="/my-leaves" element={<ProtectedRoute requiredPermission="view_own_leaves"><MyLeaves /></ProtectedRoute>} />
                <Route path="/leave/:id" element={<ProtectedRoute requiredPermission="view_own_leaves"><LeaveDetail /></ProtectedRoute>} />
                <Route path="/approvals" element={<ProtectedRoute requiredPermission="approve_leaves"><Approvals /></ProtectedRoute>} />

                <Route path="/employees" element={<ProtectedRoute requiredPermission="manage_employees"><Employees /></ProtectedRoute>} />
                <Route path="/company" element={<ProtectedRoute requiredPermission="system_settings"><Company /></ProtectedRoute>} />
                <Route path="/departments" element={<ProtectedRoute requiredPermission="manage_departments"><Departments /></ProtectedRoute>} />
                <Route path="/roles" element={<ProtectedRoute requiredPermission="manage_roles"><Roles /></ProtectedRoute>} />
                <Route path="/roles-permissions" element={<ProtectedRoute requiredPermission="manage_roles"><RolesPermissions /></ProtectedRoute>} />
                <Route path="/designations" element={<ProtectedRoute requiredPermission="manage_designations"><Designations /></ProtectedRoute>} />
                <Route path="/leave-types" element={<ProtectedRoute requiredPermission="manage_leave_types"><LeaveTypes /></ProtectedRoute>} />
                <Route path="/leave-policies" element={<ProtectedRoute requiredPermission="manage_policies"><LeavePolicies /></ProtectedRoute>} />
                <Route path="/email-configuration" element={<ProtectedRoute requiredPermission="system_settings"><EmailConfiguration /></ProtectedRoute>} />
                <Route path="/leave-notification-rules" element={<ProtectedRoute requiredPermission="system_settings"><LeaveNotificationRules /></ProtectedRoute>} />
                <Route path="/holiday-configuration" element={<ProtectedRoute requiredPermission="system_settings"><HolidayConfiguration /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute requiredPermission="view_reports"><Reports /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </HolidayProvider>
      </LeaveRequestProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
