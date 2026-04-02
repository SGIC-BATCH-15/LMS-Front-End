import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL } from "../../constants/Api";
import { companies, departments, users, leavePolicies, leaveBalances, leaveRequests, notifications } from "@/data/mockData";
import { designationsList } from "@/data/designationsList";
import { permissions, defaultRolePermissions } from "@/data/permissions";
import { Company, Department, User, LeavePolicy, LeaveBalance, LeaveRequest as LeaveRequestType, Notification } from "@/types";

const TOKEN_KEY = "authToken";
const DEMO_MODE = true;

const baseClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
});

const mockDelay = (result: any, ms = 120): Promise<any> => new Promise((resolve) => setTimeout(() => resolve(result), ms));

const makeResponse = (data: any, status = 200): Promise<AxiosResponse> => {
  return mockDelay({
    data,
    status,
    statusText: status === 200 ? "OK" : "ERROR",
    headers: {},
    config: {},
    request: {}
  });
};

const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const mockGet = async (url: string, config?: AxiosRequestConfig) => {
  const u = url.toLowerCase();

  if (u.includes('/auth/logout') || u.includes('/auth/login')) {
    return makeResponse({ message: 'Demo auth flow' });
  }

  if (u.includes('/settings/company')) {
    // Support paginated company list
    return makeResponse({ data: { content: companies, totalElements: companies.length, totalPages: 1, size: companies.length, number: 0 }});
  }

  if (u.includes('/settings/department')) {
    if (u.match(/\/settings\/department\/[^\/]+$/)) {
      const id = u.split('/').pop()!;
      const dep = departments.find(d => d.id === id);
      return makeResponse({ data: dep || null });
    }
    return makeResponse({ data: { content: departments, totalElements: departments.length, totalPages: 1, size: departments.length, number: 0 }});
  }

  if (u.includes('/settings/designation')) {
    return makeResponse({ data: { content: designationsList, totalElements: designationsList.length, totalPages: 1, size: designationsList.length, number: 0 }});
  }

  if (u.includes('/settings/employees')) {
    if (u.match(/\/settings\/employees\/[^\/]+$/)) {
      const id = u.split('/').pop()!;
      const user = users.find(u => u.id.toString() === id.toString());
      return makeResponse({ data: user || null });
    }
    return makeResponse({ data: { content: users, totalElements: users.length, totalPages: 1, size: users.length, number: 0 }});
  }

  if (u.includes('/settings/role-privileges/get')) {
    const user = getCurrentUser();
    const role = user?.role || 'employee';
    const defaultSet = defaultRolePermissions[role] || new Set();
    const rolePrivs = Array.from(defaultSet).map((code, idx) => ({
      id: idx + 1,
      roleId: 1,
      roleName: role,
      privilegeId: idx + 1,
      privilegeName: code,
      privilegeCode: code,
      canRead: true,
      canWrite: true,
      canUpdate: true,
      canDelete: true
    }));
    return makeResponse({ data: rolePrivs });
  }

  if (u.includes('/settings/user-privileges/mine') || u.includes('/company-privileges/mine')) {
    return makeResponse({ data: [] });
  }

  if (u.includes('/company-privileges')) {
    // if /company-privileges/{id}
    const role = getCurrentUser()?.role || 'employee';
    const available = Array.from(defaultRolePermissions[role] || new Set()).map(code => ({ id: 0, name: code, code, description: 'Mocked company privilege', category: 'PRIVILEGE' }));
    return makeResponse({ data: { companyId: 1, companyName: 'Demo', privileges: available }});
  }

  if (u.includes('/leave-policies')) {
    return makeResponse({ data: { content: leavePolicies, totalElements: leavePolicies.length, totalPages: 1, size: leavePolicies.length, number: 0 }});
  }

  if (u.includes('/leavemanagement/leaverequest')) {
    if (u.match(/\/leavemanagement\/leaverequest\/\d+$/)) {
      const id = u.split('/').pop();
      const request = leaveRequests.find(r => r.id === id || r.id === `req-${id}`);
      return makeResponse({ data: request || null });
    }
    return makeResponse({ data: leaveRequests });
  }

  if (u.includes('/leavemanagement/leavetype/get')) {
    const types = Array.from(new Set(leavePolicies.map(policy => policy.leaveType))).map((lt, idx) => ({ id: idx + 1, leaveType: lt }));
    // Return direct page response object (not wrapped with nested data)
    return makeResponse({ content: types, totalElements: types.length, totalPages: 1, size: types.length, number: 0 });
  }

  if (u.includes('/leave-allocation/balance/me')) {
    const user = getCurrentUser();
    if (!user) return makeResponse(null);
    const balances = leaveBalances.filter(lb => lb.userId === user.id);
    const response = { employeeId: 1, employeeName: user.name, year: new Date().getFullYear(), leaveBalances: balances.map(lb => ({
      leaveTypeId: 0,
      leaveTypeName: lb.leaveType,
      allocatedDays: lb.total,
      carriedForwardDays: lb.carryForward || 0,
      usedDays: lb.used,
      remainingDays: lb.total - lb.used
    }))};
    return makeResponse(response);
  }

  if (u.includes('/dashboard/calculatependingrequest')) {
    const reqs = leaveRequests.filter(lr => lr.status === 'pending');
    return makeResponse({ data: reqs.length });
  }

  if (u.includes('/dashboard/calculateleavetaken')) {
    const total = leaveBalances.reduce((sum, lb) => sum + lb.used, 0);
    return makeResponse({ data: total });
  }

  if (u.includes('/dashboard/calculatereject/rejected')) {
    const rejected = leaveRequests.filter(lr => lr.status === 'rejected').length;
    return makeResponse({ data: rejected });
  }

  if (u.includes('/leave/approvals/pending')) {
    const pending = leaveRequests.filter(lr => lr.status === 'pending');
    return makeResponse({ data: pending });
  }

  // Fallback to real API when no demo path matched
  return baseClient.get(url, config);
};

const mockPost = async (url: string, body?: any, config?: AxiosRequestConfig) => {
  const u = url.toLowerCase();

  if (u.includes('/leavemanagement/leaverequest/add')) {
    const nextId = `req-${leaveRequests.length + 1}`;
    const newRequest: LeaveRequestType = {
      id: nextId,
      employeeId: getCurrentUser()?.id || 'user-6',
      employeeName: getCurrentUser()?.name || 'Demo User',
      leaveType: body.leaveTypeId ? body.leaveTypeId.toString() as any : 'annual',
      startDate: body.startDate,
      endDate: body.endDate,
      days: body.leaveDuration || 1,
      reason: body.reason,
      status: 'pending',
      toRecipients: [],
      ccRecipients: [],
      approvalSteps: [],
      currentStep: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissions: {
        canApprove: false,
        canReject: false,
        canCancel: true,
      }
    };
    leaveRequests.push(newRequest);
    return makeResponse({ data: newRequest, status: 201 });
  }

  if (u.includes('/company-privileges/') || u.includes('/settings/roles/add') || u.includes('/settings/employees/add') || u.includes('/settings/department/add') || u.includes('/settings/company/add') || u.includes('/leavemanagement/leavetype/add')) {
    return makeResponse({ data: body || {}, status: 200 });
  }

  return baseClient.post(url, body, config);
};

const mockPut = async (url: string, body?: any, config?: AxiosRequestConfig) => {
  if (url.includes('/settings/department/') || url.includes('/settings/company/') || url.includes('/settings/roles/') || url.includes('/leavemanagement/leavetype/')) {
    return makeResponse({ data: body || {}, status: 200 });
  }
  if (url.includes('/settings/employees/')) {
    return makeResponse({ data: body || {}, status: 200 });
  }
  return baseClient.put(url, body, config);
};

const mockDelete = async (url: string, config?: AxiosRequestConfig) => {
  if (url.includes('/settings/department/') || url.includes('/settings/company/') || url.includes('/settings/roles/') || url.includes('/leavemanagement/leavetype/') || url.includes('/company-privileges/')) {
    return makeResponse({ data: { success: true }, status: 200 });
  }
  return baseClient.delete(url, config);
};

const apiClient = DEMO_MODE
  ? { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete }
  : baseClient;

if (!DEMO_MODE) {
  // request interceptor for normal mode only
  apiClient.interceptors?.request.use?.((config: any) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (process.env.NODE_ENV === "development") {
      console.log("=== API Request ===");
      console.log("URL:", `${config.baseURL}${config.url}`);
    }

    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }, (error: any) => Promise.reject(error));

  apiClient.interceptors?.response.use?.((response: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log("=== API Response ===", response.status);
    }
    return response;
  }, (error: any) => {
    if (!error.response) {
      console.error("Network error or server not reachable");
      return Promise.reject({
        message: "Server not reachable. Please try again later.",
      });
    }

    const { status } = error.response;
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  });
}

export default apiClient;