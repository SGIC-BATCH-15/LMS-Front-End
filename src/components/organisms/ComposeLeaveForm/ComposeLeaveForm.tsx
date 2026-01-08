import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLeaveRequests } from '@/context/LeaveRequestContext';
import { useHolidays } from '@/context/HolidayContext';
import { User, LeaveType, LeaveRequest, ApprovalStep, BackendEmployee } from '@/types';
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
import { fetchToRecipient, fetchCcEmails, createLeaveRequest } from '@/components/services/leaveRequestService';

const leaveTypes: { value: LeaveType; label: string }[] = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

interface ComposeLeaveFormProps {
  initialData?: LeaveRequest;
  onClose?: () => void;
}

export const ComposeLeaveForm: React.FC<ComposeLeaveFormProps> = ({ initialData, onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addLeaveRequest, updateLeaveRequest } = useLeaveRequests();
  const { holidays } = useHolidays();

  // State for backend data
  const [leaveTypesFromDB, setLeaveTypesFromDB] = useState<LeaveTypeResponseDto[]>([]);
  const [toRecipientsFromDB, setToRecipientsFromDB] = useState<BackendEmployee[]>([]);
  const [ccRecipientsFromDB, setCcRecipientsFromDB] = useState<BackendEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Find initial users from IDs if editing
  const initialToUser = initialData ? users.find(u => u.id === initialData.toRecipients[0]) || null : null;
  const initialCcUsers = initialData ? users.filter(u => initialData.ccRecipients.includes(u.id)) : [];

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
  const [halfDayType, setHalfDayType] = useState<'morning' | 'afternoon'>('morning');

  // Fetch leave types, TO recipients, and CC recipients from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch leave types from database
        const leaveTypesResponse = await getAllLeaveTypes(0, 100);
        console.log("Leave Types Response:", leaveTypesResponse);
        setLeaveTypesFromDB(leaveTypesResponse.content);

        // Fetch TO recipients based on user's role and company
        const toRecipients = await fetchToRecipient();
        console.log("TO Recipients Final:", toRecipients);
        setToRecipientsFromDB(toRecipients);

        // Fetch CC recipients based on user's role and company
        const ccRecipients = await fetchCcEmails();
        console.log("CC Recipients Final:", ccRecipients);
        setCcRecipientsFromDB(ccRecipients);

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
  }, []);

  // Filter to show only HR/Admin users for To field
  const availableHrUsers = users.filter(u => u.id !== currentUser.id && (u.role === 'admin' || u.departmentId === 'dept-2'));
  const availableUsers = users.filter(u => u.id !== currentUser.id);
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
    console.log('=== Form Submission Debug ===');
    console.log('TO Recipient:', toRecipient);
    console.log('CC Recipients:', ccRecipients);
    console.log('Leave Type ID:', leaveTypeId);
    
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
    if (effectiveDays > availableDays) {
      toast.error(`You only have ${availableDays} days available for ${leaveType} leave`);
      return;
    }

    try {
      setSubmitting(true);

      // Prepare the payload
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

      console.log('=== Payload Being Sent ===');
      console.log('Full Payload:', JSON.stringify(payload, null, 2));
      console.log('CC Employee IDs:', payload.ccEmailEmployeeIds);

      // Submit to backend
      const response = await createLeaveRequest(payload);

      if (response.statusCode === 2001) {
        toast.success(response.statusMessage || 'Leave request submitted successfully!');
        
        // Optionally, update local state for UI consistency
        if (!initialData) {
          // Create approval steps for local context
          const steps: ApprovalStep[] = [
            {
              id: `step-${Date.now()}-1`,
              approverId: toRecipient.id.toString(),
              approverName: `${toRecipient.firstName} ${toRecipient.lastName}`,
              approverRole: 'Approver',
              status: 'pending',
              order: 1,
            },
          ];

          const newRequest: LeaveRequest = {
            id: `req-${response.data.id}`,
            employeeId: currentUser.id,
            employeeName: currentUser.name,
            leaveType,
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            days: effectiveDays,
            reason: reason.trim(),
            status: 'pending',
            toRecipients: [toRecipient.id.toString()],
            ccRecipients: ccRecipients.map(cc => cc.id.toString()),
            approvalSteps: steps,
            currentStep: 1,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
            permissions: {
              canApprove: false,
              canReject: false,
              canCancel: true,
            },
          };
          addLeaveRequest(newRequest);
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
      {/* Email-style header */}
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
                  <button onClick={removeToRecipient} className="hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
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
                  <button onClick={() => removeCcRecipient(employee.id)} className="hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="relative">
                <Input
                  placeholder="Add cc..."
                  value={searchCc}
                  onChange={(e) => setSearchCc(e.target.value)}
                  onFocus={() => setShowCcSuggestions(true)}
                  className="w-40 h-8 border-0 bg-transparent focus-visible:ring-0 px-2"
                />
                {showCcSuggestions && (
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
                // Map leave type for local UI consistency
                const selectedLeaveType = leaveTypesFromDB.find(lt => lt.id === selectedId);
                if (selectedLeaveType) {
                  // Map backend leave type to frontend LeaveType
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
                  modifiers={{
                    holiday: holidays.map(h => h.date)
                  }}
                  modifiersStyles={{
                    holiday: { color: 'red', fontWeight: 'bold' }
                  }}
                  classNames={{
                    day_selected: "bg-transparent text-foreground hover:bg-accent focus:bg-accent",
                    day_range_middle: "bg-accent/50",
                    day_range_start: "border border-blue-500",
                    day_range_end: "border border-blue-500",
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

      {/* Message body */}
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

      {/* Footer with actions */}
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
