import apiClient from "./apiClient";
import { API_BASE_URL } from "@/constants/Api";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLeaveRequests } from '@/context/LeaveRequestContext';
import { LeaveType, LeaveRequest, ApprovalStep, BackendEmployee } from '@/types';
import { users, leaveBalances } from '@/data/mockData';
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Send, X, Plus, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getAllLeaveTypes, LeaveTypeResponseDto } from '@/components/services/leavetypeService';
import employeeService from "./employeeService";

// Employee interface for TO and CC recipients
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Response interfaces
export interface LeaveTypeResponse {
  id: number;
  leaveType: string;
}

export interface LeaveRequestResponse {
  statusCode: number;
  statusMessage: string;
  data: {
    id: number;
    leaveType: LeaveTypeResponse;
    employee: Employee;
    startDate: string;
    endDate: string;
    leaveDuration: number;
    reason: string;
    status: string;
    halfDay: boolean;
    halfDayType: string | null;
    toEmail: Employee;
    ccEmails: Employee[];
    createdAt: string;
    updatedAt: string;
  };
}

// Leave Request Item (for list)
export interface LeaveRequestItem {
  id: number;
  leaveType: LeaveTypeResponse;
  employee: Employee;
  startDate: string;
  endDate: string;
  leaveDuration: number;
  reason: string;
  status: string;
  halfDay: boolean;
  halfDayType: string | null;
  toEmail: Employee;
  ccEmails: Employee[];
  createdAt: string;
  updatedAt: string;
  approvedBy?: Employee;
  approvedAt?: string;
  rejectedBy?: Employee;
  rejectedAt?: string;
  comments?: string;
}

// Response for fetching all leave requests
export interface AllLeaveRequestsResponse {
  statusCode: number;
  statusMessage: string;
  data: LeaveRequestItem[];
}

// Request payload interface
export interface CreateLeaveRequestPayload {
  leaveTypeId: number;
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
  reason: string;
  halfDay: boolean;
  halfDayType?: "MORNING" | "AFTERNOON" | null;
  toEmailEmployeeId: number;
  ccEmailEmployeeIds: number[];
}

const LEAVE_MANAGEMENT_BASE = `${API_BASE_URL}/leavemanagement`;

/**
 * Fetch TO recipient email based on logged-in user's role and company configuration
 */
export const fetchToRecipient = async (): Promise<Employee[]> => {
  try {
    const response = await apiClient.get(
      `${LEAVE_MANAGEMENT_BASE}/notification-config/to-recipient`
    );

    console.log("TO Recipients Response:", response.data);

    const responseData = response.data;

    // Handle statusCode wrapper
    if (responseData?.statusCode && responseData?.data) {
      const data = responseData.data;

      // If data is a single Employee object, wrap in array
      if (data && typeof data === 'object' && data.id) {
        console.log("TO Recipient (Employee object):", [data]);
        return [data];
      }
      // If data is an array of Employee objects
      else if (Array.isArray(data) && data.length > 0) {
        console.log("TO Recipients (Employee array):", data);
        return data;
      }
    }

    // Direct Employee object
    if (responseData && typeof responseData === 'object' && responseData.id) {
      console.log("TO Recipient (direct object):", [responseData]);
      return [responseData];
    }

    // Direct array of Employee objects
    if (Array.isArray(responseData) && responseData.length > 0) {
      console.log("TO Recipients (direct array):", responseData);
      return responseData;
    }

    console.log("TO Recipients: No valid data found");
    return [];
  } catch (error: any) {
    console.error("Error fetching TO recipient:", error);
    console.error("Error response:", error.response?.data);
    return [];
  }
};

/**
 * Fetch CC email recipients based on logged-in user's role and company configuration
 */
export const fetchCcEmails = async (): Promise<Employee[]> => {
  try {
    const response = await apiClient.get(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest/cc-email`
    );

    console.log("CC Recipients Response:", response.data);

    const responseData = response.data;

    // Handle statusCode wrapper
    if (responseData?.statusCode && responseData?.data) {
      const data = responseData.data;

      // If data is an array of Employee objects
      if (Array.isArray(data)) {
        console.log("CC Recipients (Employee array):", data);
        return data;
      }
      // If data is a single Employee object
      else if (data && typeof data === 'object' && data.id) {
        console.log("CC Recipient (Single Employee):", [data]);
        return [data];
      }
    }

    // Direct array of Employee objects
    if (Array.isArray(responseData)) {
      console.log("CC Recipients (direct array):", responseData);
      return responseData;
    }

    console.log("CC Recipients: No valid data found");
    return [];
  } catch (error: any) {
    console.error("Error fetching CC emails:", error);
    console.error("Error response:", error.response?.data);
    return [];
  }
};

/**
 * Submit a new leave request
 */
export const createLeaveRequest = async (
  payload: CreateLeaveRequestPayload
): Promise<LeaveRequestResponse> => {
  try {
    console.log("=== Sending Leave Request ===");
    console.log("Payload:", payload);

    const response = await apiClient.post<LeaveRequestResponse>(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest/add`,
      payload
    );

    console.log("=== Leave Request Response ===");
    console.log("Response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("Error creating leave request:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error status:", error.response?.status);
    throw error;
  }
};

/**
 * Fetch all leave requests for the logged-in employee
 */
export const getAllLeaveRequests = async (): Promise<LeaveRequestItem[]> => {
  try {
    const response = await apiClient.get(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest`
    );

    console.log("All Leave Requests Response:", response.data);

    const responseData = response.data;

    // Handle statusCode wrapper
    if (responseData?.statusCode && responseData?.data) {
      const data = responseData.data;

      // If data is an array of leave requests
      if (Array.isArray(data)) {
        console.log("Leave Requests (array):", data);
        return data;
      }
    }

    // Direct array
    if (Array.isArray(responseData)) {
      console.log("Leave Requests (direct array):", responseData);
      return responseData;
    }

    console.log("Leave Requests: No valid data found");
    return [];
  } catch (error: any) {
    console.error("Error fetching leave requests:", error);
    console.error("Error response:", error.response?.data);
    return [];
  }
};

/**
 * Fetch a single leave request by ID
 */
export const getLeaveRequestById = async (leaveRequestId: number): Promise<LeaveRequestItem> => {
  try {
    const response = await apiClient.get(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest/${leaveRequestId}`
    );

    console.log("Leave Request By ID Response:", response.data);

    const responseData = response.data;

    // Handle statusCode wrapper
    if (responseData?.statusCode && responseData?.data) {
      return responseData.data;
    }

    // Direct data
    return responseData;
  } catch (error: any) {
    console.error("Error fetching leave request by ID:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

/**
 * Update a leave request by ID
 */
export const updateLeaveRequest = async (
  leaveRequestId: number,
  payload: CreateLeaveRequestPayload
): Promise<LeaveRequestResponse> => {
  try {
    console.log("=== Updating Leave Request ===");
    console.log("Leave Request ID:", leaveRequestId);
    console.log("Payload:", payload);

    const response = await apiClient.put<LeaveRequestResponse>(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest/${leaveRequestId}`,
      payload
    );

    console.log("=== Update Leave Request Response ===");
    console.log("Response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("Error updating leave request:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error status:", error.response?.status);
    throw error;
  }
};

/**
 * Delete a leave request by ID
 */
export const deleteLeaveRequest = async (leaveRequestId: number): Promise<void> => {
  try {
    const response = await apiClient.delete(
      `${LEAVE_MANAGEMENT_BASE}/leaverequest/${leaveRequestId}`
    );

    console.log("Delete Leave Request Response:", response.data);
  } catch (error: any) {
    console.error("Error deleting leave request:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

/**
 * Fetch pending leave approvals for the logged-in employee
 */
export const getPendingApprovals = async (): Promise<LeaveRequestItem[]> => {
  try {
    const response = await apiClient.get(
      `${API_BASE_URL}/leave/approvals/pending`
    );

    console.log("Pending Approvals Response:", response.data);

    const responseData = response.data;

    // Handle statusCode wrapper
    if (responseData?.statusCode && responseData?.data) {
      const data = responseData.data;

      // If data is an array of leave requests
      if (Array.isArray(data)) {
        console.log("Pending Approvals (array):", data);
        return data;
      }
    }

    // Direct array
    if (Array.isArray(responseData)) {
      console.log("Pending Approvals (direct array):", responseData);
      return responseData;
    }

    console.log("Pending Approvals: No valid data found");
    return [];
  } catch (error: any) {
    console.error("Error fetching pending approvals:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

/**
 * Approve a leave request
 */
export const approveLeaveRequest = async (leaveRequestId: number): Promise<any> => {
  try {
    const payload = {
      leaveRequestId: leaveRequestId,
      status: "APPROVED"
    };

    const response = await apiClient.post(
      `${API_BASE_URL}/leave/approve`,
      payload
    );

    console.log("Approve Leave Request Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error approving leave request:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

/**
 * Reject a leave request
 */
export const rejectLeaveRequest = async (leaveRequestId: number): Promise<any> => {
  try {
    const payload = {
      leaveRequestId: leaveRequestId,
      status: "REJECTED"
    };

    const response = await apiClient.post(
      `${API_BASE_URL}/leave/approve`,
      payload
    );

    console.log("Reject Leave Request Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error rejecting leave request:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

const leaveTypes: { value: LeaveType; label: string }[] = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

interface EditLeaveFormProps {
  initialData?: LeaveRequest;
  originalBackendData?: LeaveRequestItem;
  onClose?: () => void;
}

export const EditLeaveForm: React.FC<EditLeaveFormProps> = ({ initialData, originalBackendData, onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addLeaveRequest, updateLeaveRequest: updateContextLeaveRequest } = useLeaveRequests();

  // State for backend data
  const [leaveTypesFromDB, setLeaveTypesFromDB] = useState<LeaveTypeResponseDto[]>([]);
  const [toRecipientsFromDB, setToRecipientsFromDB] = useState<BackendEmployee[]>([]);
  const [ccRecipientsFromDB, setCcRecipientsFromDB] = useState<BackendEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize state variables
  const [toRecipient, setToRecipient] = useState<BackendEmployee | null>(null);
  const [ccRecipients, setCcRecipients] = useState<BackendEmployee[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState<number | null>(null);
  const [leaveType, setLeaveType] = useState<LeaveType>(initialData?.leaveType || 'annual');
  const [startDate, setStartDate] = useState<Date | undefined>(initialData ? new Date(initialData.startDate) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(initialData ? new Date(initialData.endDate) : undefined);
  const [reason, setReason] = useState(initialData?.reason || '');
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [showCcSuggestions, setShowCcSuggestions] = useState(false);
  const [searchTo, setSearchTo] = useState('');
  const [searchCc, setSearchCc] = useState('');
  // Check if it's a half day (0.5 days)
  const [isHalfDay, setIsHalfDay] = useState(initialData ? initialData.days === 0.5 : false);
  const [halfDayType, setHalfDayType] = useState<'morning' | 'afternoon'>(() => {
    if (originalBackendData?.halfDayType) {
      return originalBackendData.halfDayType.toLowerCase() === 'afternoon' ? 'afternoon' : 'morning';
    }
    return 'morning';
  });

  // Fetch leave types, TO recipients, and CC recipients from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch leave types from database
        const leaveTypesResponse = await getAllLeaveTypes(0, 100);
        setLeaveTypesFromDB(leaveTypesResponse.content);

        // Match initial leave type
        if (initialData && leaveTypeId === null && leaveTypesResponse.content) {
          // Try to find matching ID for the string leaveType if possible, 
          // but initialData doesn't have the ID, only the string.
          // We can try to reverse match string
          const matchingType = leaveTypesResponse.content.find(lt => lt.leaveType.toLowerCase().includes(initialData.leaveType.toLowerCase()));
          if (matchingType) {
            setLeaveTypeId(matchingType.id);
          }
        }

        const toList = await fetchToRecipient();
        setToRecipientsFromDB(toList);

        // Fetch all employees for CC suggestions (to ensure options are displayed)
        let employeesList: Employee[] = [];
        try {
          const allEmployees = await employeeService.getAllEmployees();
          // Map to local Employee interface if necessary, assuming structure matches
          employeesList = allEmployees.map((e: any) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            email: e.email
          }));
          setCcRecipientsFromDB(employeesList);
        } catch (err) {
          console.error("Error fetching all employees for CC:", err);
          // Fallback to fetchCcEmails if getAllEmployees fails (e.g. permissions)
          employeesList = await fetchCcEmails();
          setCcRecipientsFromDB(employeesList);
        }

        // Set initial TO recipient
        if (originalBackendData?.toEmail) {
          setToRecipient(originalBackendData.toEmail);
        } else if (initialData && initialData.toRecipients.length > 0) {
          const initialToId = parseInt(initialData.toRecipients[0]);
          const foundTo = toList.find(u => u.id === initialToId);
          if (foundTo) setToRecipient(foundTo);
        }

        // Set initial CC recipients
        if (originalBackendData?.ccEmails && originalBackendData.ccEmails.length > 0) {
          setCcRecipients(originalBackendData.ccEmails);
        } else if (initialData && initialData.ccRecipients.length > 0) {
          const initialCcIds = initialData.ccRecipients.map(id => parseInt(id));
          const foundCcs = employeesList.filter(u => initialCcIds.includes(u.id));
          setCcRecipients(foundCcs);
        }

        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load form data. Please try again.');
        // Ensure arrays are set even on error
        setToRecipientsFromDB([]);
        setCcRecipientsFromDB([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData]);

  // Filter to show only HR/Admin users for To field
  const userBalances = leaveBalances.filter(b => b.userId === currentUser.id);

  const days = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const effectiveDays = isHalfDay ? 0.5 : days;
  const selectedBalance = userBalances.find(b => b.leaveType === leaveType);
  const availableDays = selectedBalance ? selectedBalance.total - selectedBalance.used - selectedBalance.pending : 0;

  const setToRecipientAndClose = (employee: BackendEmployee) => {
    setToRecipient(employee);
    setSearchTo('');
    setShowToSuggestions(false);
  };

  const removeToRecipient = () => {
    setToRecipient(null);
  };

  const addCcRecipient = (employee: BackendEmployee) => {
    if (!ccRecipients.find(r => r.id === employee.id) && employee.id !== toRecipient?.id) {
      setCcRecipients([...ccRecipients, employee]);
    }
    setSearchCc('');
    setShowCcSuggestions(false);
  };

  const removeCcRecipient = (employeeId: number) => {
    setCcRecipients(ccRecipients.filter(r => r.id !== employeeId));
  };

  const handleSubmit = async () => {
    if (!toRecipient) {
      toast.error('Please select a recipient in the "To" field');
      return;
    }
    if (ccRecipients.length === 0) {
      toast.error('Please add at least one CC recipient');
      return;
    }
    if (!leaveTypeId) {
      toast.error('Please select a leave type');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for your leave');
      return;
    }
    // We are skipping balance check strictness or keeping it? 
    // If balance is mock, we might block user incorrectly.
    // But keeping it to match original behavior.
    if (effectiveDays > availableDays) {
      toast.error(`You only have ${availableDays} days available for ${leaveType} leave`);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        leaveTypeId: leaveTypeId,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        reason: reason.trim(),
        halfDay: isHalfDay,
        halfDayType: isHalfDay ? (halfDayType === 'morning' ? 'MORNING' as const : 'AFTERNOON' as const) : null,
        toEmailEmployeeId: toRecipient.id,
        ccEmailEmployeeIds: ccRecipients.map(cc => cc.id),
      };

      let response;
      if (initialData) {
        // Use updateLeaveRequest if editing
        const requestId = parseInt(initialData.id);
        response = await updateLeaveRequest(requestId, payload);
      } else {
        response = await createLeaveRequest(payload);
      }

      if (response.statusCode === 2001 || response.statusCode === 200) {
        const successMessage = initialData 
          ? (response.statusMessage || 'Leave request updated successfully!')
          : (response.statusMessage || 'Leave request submitted successfully!');
        toast.success(successMessage);

        // Update local context
        if (initialData) {
          // Updated request - refresh or update context
          // context update is tricky as structure differs, but MyLeaves fetches again.
          // We can just close and let MyLeaves refresh.
        }

        if (onClose) {
          onClose();
        } else {
          navigate('/my-leaves');
        }
      }
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      const errorMessage = error.response?.data?.statusMessage || 'Failed to submit leave request. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredToUsers = Array.isArray(toRecipientsFromDB) ? toRecipientsFromDB.filter(
    emp => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTo.toLowerCase())
  ) : [];

  const filteredCcUsers = Array.isArray(ccRecipientsFromDB) ? ccRecipientsFromDB.filter(
    emp => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchCc.toLowerCase()) &&
      !ccRecipients.find(r => r.id === emp.id) &&
      emp.id !== toRecipient?.id
  ) : [];

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="bg-muted/30 border-b border-border p-4 space-y-3">
        {/* To field */}
        <div className="flex items-start gap-3">
          <span className="text-sm text-muted-foreground font-medium w-12 pt-2">To:</span>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 items-center">
              {toRecipient ? (
                <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-full pl-1 pr-2 py-1">
                  <UserAvatar name={`${toRecipient.firstName} ${toRecipient.lastName}`} size="sm" />
                  <span className="text-sm font-medium">{`${toRecipient.firstName} ${toRecipient.lastName}`}</span>
                  {!initialData && (
                    <button onClick={removeToRecipient} className="hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Add TO recipient..."
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                    onFocus={() => setShowToSuggestions(true)}
                    className="w-full h-8 border-0 bg-transparent focus-visible:ring-0 px-2"
                  />
                  {showToSuggestions && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
                      {filteredToUsers.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">No recipients found</p>
                      ) : (
                        filteredToUsers.map(employee => (
                          <div
                            key={employee.id}
                            className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                            onClick={() => setToRecipientAndClose(employee)}
                          >
                            <UserAvatar name={`${employee.firstName} ${employee.lastName}`} size="sm" />
                            <div>
                              <p className="text-sm font-medium">{`${employee.firstName} ${employee.lastName}`}</p>
                              <p className="text-xs text-muted-foreground">{employee.email}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CC field */}
        <div className="flex items-start gap-3">
          <span className="text-sm text-muted-foreground font-medium w-12 pt-2">Cc:</span>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 items-center">
              {ccRecipients.map(employee => (
                <div
                  key={employee.id}
                  className="flex items-center gap-2 bg-accent/50 rounded-full pl-1 pr-2 py-1"
                >
                  <UserAvatar name={`${employee.firstName} ${employee.lastName}`} size="sm" />
                  <span className="text-sm font-medium">{`${employee.firstName} ${employee.lastName}`}</span>
                  {!initialData && (
                    <button onClick={() => removeCcRecipient(employee.id)} className="hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <div className="relative">
                {!initialData && (
                  <Input
                    placeholder="Add cc..."
                    value={searchCc}
                    onChange={(e) => setSearchCc(e.target.value)}
                    onFocus={() => setShowCcSuggestions(true)}
                    className="w-40 h-8 border-0 bg-transparent focus-visible:ring-0 px-2"
                  />
                )}
                {showCcSuggestions && !initialData && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
                    {filteredCcUsers.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">No users found</p>
                    ) : (
                      filteredCcUsers.map(employee => (
                        <div
                          key={employee.id}
                          className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                          onClick={() => addCcRecipient(employee)}
                        >
                          <UserAvatar name={`${employee.firstName} ${employee.lastName}`} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{`${employee.firstName} ${employee.lastName}`}</p>
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Leave type and dates */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="leave-type" className="text-muted-foreground text-sm">
              <span className="text-red-500">*</span> Leave Type
            </Label>
            <Select
              value={leaveTypeId?.toString()}
              onValueChange={(v) => {
                const selectedId = parseInt(v);
                setLeaveTypeId(selectedId);
                const selectedLeaveType = leaveTypesFromDB.find(lt => lt.id === selectedId);
                if (selectedLeaveType) {
                  const typeMap: Record<string, LeaveType> = {
                    'annual leave': 'annual',
                    'casual leave': 'casual',
                    'sick leave': 'sick',
                    'maternity leave': 'maternity',
                    'paternity leave': 'paternity',
                    'unpaid leave': 'unpaid',
                  };
                  const mappedType = typeMap[selectedLeaveType.leaveType.toLowerCase()] || 'annual';
                  setLeaveType(mappedType);
                }
              }}
            >
              <SelectTrigger id="leave-type">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypesFromDB.map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.leaveType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">
              <span className="text-red-500">*</span> Date Range
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start', !startDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate && endDate ? (
                    <>
                      {format(startDate, 'MMM d')} → {format(endDate, 'MMM d, yyyy')}
                    </>
                  ) : (
                    'Select date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: startDate, to: endDate }}
                  onSelect={(range) => {
                    setStartDate(range?.from);
                    setEndDate(range?.to);
                  }}
                  initialFocus
                  numberOfMonths={2}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="half-day" className="text-muted-foreground text-sm">Half Day</Label>
            <div className="flex items-center space-x-2 h-10">
              <Switch
                id="half-day"
                checked={isHalfDay}
                onCheckedChange={setIsHalfDay}
              />
              <Label htmlFor="half-day" className="text-sm font-normal cursor-pointer">
                {isHalfDay ? 'Yes' : 'No'}
              </Label>
            </div>
          </div>

          {isHalfDay && (
            <div className="space-y-2">
              <Label htmlFor="half-day-type" className="text-muted-foreground text-sm">
                <span className="text-red-500">*</span> Half Day Type
              </Label>
              <Select value={halfDayType} onValueChange={(v) => setHalfDayType(v as 'morning' | 'afternoon')}>
                <SelectTrigger id="half-day-type">
                  <SelectValue placeholder="Select half day type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {days > 0 && (
          <div className="pt-2 text-sm text-muted-foreground">
            Duration: <span className="font-medium text-foreground">{isHalfDay ? '0.5' : days} day{days > 1 && !isHalfDay ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <Label htmlFor="reason" className="text-muted-foreground text-sm">
          <span className="text-red-500">*</span> Reason for Leave
        </Label>
        <Textarea
          id="reason"
          placeholder="Explain the reason for your leave request..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[150px] resize-none"
          maxLength={500}
        />
        <div className="text-right text-xs text-muted-foreground">
          {reason.length} / 500
        </div>
      </div>

      <div className="border-t border-border p-4 flex items-center justify-between bg-muted/30">
        <div className="text-sm text-muted-foreground">
          {selectedBalance && (
            <span>
              Available {leaveType} leave: <strong className="text-foreground">{availableDays} days</strong>
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose || (() => navigate(-1))} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} className="gap-2" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {initialData ? 'Update Request' : 'Send Request'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
