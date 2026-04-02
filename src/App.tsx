import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CompanyPrivilegeProvider } from "@/context/CompanyPrivilegeContext";
import { RolePrivilegeProvider } from "@/context/RolePrivilegeContext";
import { LeaveRequestProvider } from "@/context/LeaveRequestContext";
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
import { LeaveAllocation } from "./pages/LeaveAllocation";
import { CompanyPrivilegeSettings } from "./pages/CompanyPrivilegeSettings";
import { RolePrivilegeSettings } from "./pages/RolePrivilegeSettings";
import { UserPrivilegeSettings } from "./pages/UserPrivilegeSettings";

import NotFound from "./pages/NotFound";
import { HolidayConfiguration } from "./pages/HolidayConfiguration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyPrivilegeProvider>
        <RolePrivilegeProvider>
          <LeaveRequestProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/dashboard" element={<ProtectedRoute requiredPermission="view_dashboard" requiredPrivilegeCode="VIEW_DASHBOARD"><Dashboard /></ProtectedRoute>} />
                  <Route path="/apply-leave" element={<ProtectedRoute requiredPermission="apply_leave" requiredPrivilegeCode="APPLY_LEAVE"><ApplyLeave /></ProtectedRoute>} />
                  <Route path="/my-leaves" element={<ProtectedRoute requiredPermission="view_own_leaves" requiredPrivilegeCode="VIEW_OWN_LEAVES"><MyLeaves /></ProtectedRoute>} />
                  <Route path="/leave/:id" element={<ProtectedRoute requiredPermission="view_own_leaves" requiredPrivilegeCode="VIEW_OWN_LEAVES"><LeaveDetail /></ProtectedRoute>} />
                  <Route path="/approvals" element={<ProtectedRoute requiredPermission="approve_leaves" requiredPrivilegeCode="APPROVE_LEAVES"><Approvals /></ProtectedRoute>} />

                  <Route path="/employees" element={<ProtectedRoute requiredPermission="manage_employees" requiredPrivilegeCode="MANAGE_EMPLOYEES"><Employees /></ProtectedRoute>} />
                  <Route path="/company" element={<ProtectedRoute requiredPermission="system_settings" requiredPrivilegeCode="MANAGE_COMPANY"><Company /></ProtectedRoute>} />
                  <Route path="/departments" element={<ProtectedRoute requiredPermission="manage_departments" requiredPrivilegeCode="MANAGE_DEPARTMENTS"><Departments /></ProtectedRoute>} />
                  <Route path="/roles" element={<ProtectedRoute requiredPermission="manage_roles" requiredPrivilegeCode="MANAGE_ROLES"><Roles /></ProtectedRoute>} />
                  <Route path="/roles-permissions" element={<ProtectedRoute requiredPermission="manage_roles"><RolesPermissions /></ProtectedRoute>} />
                  <Route path="/designations" element={<ProtectedRoute requiredPermission="manage_designations" requiredPrivilegeCode="MANAGE_DESIGNATION"><Designations /></ProtectedRoute>} />
                  <Route path="/leave-types" element={<ProtectedRoute requiredPermission="manage_leave_types" requiredPrivilegeCode="MANAGE_LEAVE_TYPES"><LeaveTypes /></ProtectedRoute>} />
                  <Route path="/leave-policies" element={<ProtectedRoute requiredPermission="manage_policies" requiredPrivilegeCode="MANAGE_LEAVE_POLICIES"><LeavePolicies /></ProtectedRoute>} />
                  <Route path="/email-configuration" element={<ProtectedRoute requiredPermission="system_settings" requiredPrivilegeCode="MANAGE_EMAIL_CONFIGURATION"><EmailConfiguration /></ProtectedRoute>} />
                  <Route path="/leave-notification-rules" element={<ProtectedRoute requiredPermission="system_settings" requiredPrivilegeCode="MANAGE_LEAVE_NOTIFICATION_RULES"><LeaveNotificationRules /></ProtectedRoute>} />
                  <Route path="/leave-allocation" element={<ProtectedRoute requiredPermission="manage_policies" requiredPrivilegeCode="MANAGE_LEAVE_ALLOCATION"><LeaveAllocation /></ProtectedRoute>} />
                  <Route path="/company-privilege-settings" element={<ProtectedRoute requiredPermission="system_settings" requiredPrivilegeCode="COMPANY_PRIVILEGE"><CompanyPrivilegeSettings /></ProtectedRoute>} />
                  <Route path="/role-privilege-settings" element={<ProtectedRoute requiredPermission="manage_roles" requiredPrivilegeCode="ROLE_PRIVILEGE"><RolePrivilegeSettings /></ProtectedRoute>} />
                  <Route path="/user-privilege-settings" element={<ProtectedRoute requiredPermission="manage_roles" requiredPrivilegeCode="USER_PRIVILEGE"><UserPrivilegeSettings /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute requiredPermission="view_reports" requiredPrivilegeCode="VIEW_REPORTS"><Reports /></ProtectedRoute>} />
                  <Route path="/holiday-configuration" element={<ProtectedRoute requiredPermission="system_settings" requiredPrivilegeCode="MANAGE_HOLIDAY_CONFIGURATION"><HolidayConfiguration /></ProtectedRoute>} />              <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </LeaveRequestProvider>
        </RolePrivilegeProvider>
      </CompanyPrivilegeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
