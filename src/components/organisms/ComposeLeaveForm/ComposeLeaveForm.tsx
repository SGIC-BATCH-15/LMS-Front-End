import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLeaveRequests } from '@/context/LeaveRequestContext';
import { User, LeaveType, LeaveRequest, ApprovalStep } from '@/types';
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
import { CalendarIcon, Send, X, Plus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

  // Find initial users from IDs if editing
  const initialToUser = initialData ? users.find(u => u.id === initialData.toRecipients[0]) || null : null;
  const initialCcUsers = initialData ? users.filter(u => initialData.ccRecipients.includes(u.id)) : [];

  const [toRecipient, setToRecipient] = useState<User | null>(initialToUser);
  const [ccRecipients, setCcRecipients] = useState<User[]>(initialCcUsers);
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

  // Filter to show only HR/Admin users for To field
  const availableHrUsers = users.filter(u => u.id !== currentUser.id && (u.role === 'admin' || u.departmentId === 'dept-2'));
  const availableUsers = users.filter(u => u.id !== currentUser.id);
  const userBalances = leaveBalances.filter(b => b.userId === currentUser.id);

  const days = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const effectiveDays = isHalfDay ? 0.5 : days;
  const selectedBalance = userBalances.find(b => b.leaveType === leaveType);
  const availableDays = selectedBalance ? selectedBalance.total - selectedBalance.used - selectedBalance.pending : 0;

  const setToRecipientAndClose = (user: User) => {
    setToRecipient(user);
    setSearchTo('');
    setShowToSuggestions(false);
  };

  const removeToRecipient = () => {
    setToRecipient(null);
  };

  const addCcRecipient = (user: User) => {
    if (!ccRecipients.find(r => r.id === user.id) && user.id !== toRecipient?.id) {
      setCcRecipients([...ccRecipients, user]);
    }
    setSearchCc('');
    setShowCcSuggestions(false);
  };

  const removeCcRecipient = (userId: string) => {
    setCcRecipients(ccRecipients.filter(r => r.id !== userId));
  };

  const handleSubmit = () => {
    if (!toRecipient) {
      toast.error('Please add a recipient in the "To" field (HR email)');
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

    if (initialData) {
      // Update existing request
      updateLeaveRequest(initialData.id, {
        leaveType,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        days: isHalfDay ? 0.5 : days,
        reason: reason.trim(),
        toRecipients: [toRecipient.id],
        ccRecipients: ccRecipients.map(cc => cc.id),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Leave request updated successfully!');
    } else {
      // Create approval steps
      const steps: ApprovalStep[] = [
        {
          id: `step-${Date.now()}-1`,
          approverId: toRecipient.id,
          approverName: toRecipient.name,
          approverRole: toRecipient.designation,
          status: 'pending',
          order: 1,
        },
      ];

      // If the recipient is NOT Sarah Johnson (HR), add her as a second step
      // ensuring we have a multi-step timeline like in the designs
      const hrUser = users.find(u => u.id === 'user-1');
      if (toRecipient.id !== 'user-1' && hrUser) {
        steps.push({
          id: `step-${Date.now()}-2`,
          approverId: hrUser.id,
          approverName: hrUser.name,
          approverRole: hrUser.designation,
          status: 'pending',
          order: 2,
        });
      }

      // Create new leave request
      const newRequest: LeaveRequest = {
        id: `req-${Date.now()}`,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        leaveType,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        days: isHalfDay ? 0.5 : days,
        reason: reason.trim(),
        status: 'pending',
        toRecipients: [toRecipient.id],
        ccRecipients: ccRecipients.map(cc => cc.id),
        approvalSteps: steps,
        currentStep: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: {
          canApprove: false,
          canReject: false,
          canCancel: true,
        },
      };
      addLeaveRequest(newRequest);
      toast.success('Leave request submitted successfully!');
    }

    if (onClose) {
      onClose();
    } else {
      navigate('/my-leaves');
    }
  };

  const filteredToUsers = availableHrUsers.filter(
    u => u.name.toLowerCase().includes(searchTo.toLowerCase())
  );

  const filteredCcUsers = availableUsers.filter(
    u => u.name.toLowerCase().includes(searchCc.toLowerCase()) &&
      !ccRecipients.find(r => r.id === u.id) &&
      u.id !== toRecipient?.id
  );

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
                  <UserAvatar name={toRecipient.name} size="sm" />
                  <span className="text-sm font-medium">{toRecipient.name}</span>
                  <button onClick={removeToRecipient} className="hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Add HR recipient..."
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                    onFocus={() => setShowToSuggestions(true)}
                    className="w-full h-8 border-0 bg-transparent focus-visible:ring-0 px-2"
                  />
                  {showToSuggestions && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-auto">
                      {filteredToUsers.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">No HR users found</p>
                      ) : (
                        filteredToUsers.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                            onClick={() => setToRecipientAndClose(user)}
                          >
                            <UserAvatar name={user.name} size="sm" />
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.designation}</p>
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
              {ccRecipients.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-accent/50 rounded-full pl-1 pr-2 py-1"
                >
                  <UserAvatar name={user.name} size="sm" />
                  <span className="text-sm font-medium">{user.name}</span>
                  <button onClick={() => removeCcRecipient(user.id)} className="hover:text-destructive">
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
                      filteredCcUsers.map(user => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                          onClick={() => addCcRecipient(user)}
                        >
                          <UserAvatar name={user.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.designation}</p>
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
            <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
              <SelectTrigger id="leave-type">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
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
          <Button variant="outline" onClick={onClose || (() => navigate(-1))}>Cancel</Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Send className="w-4 h-4" />
            {initialData ? 'Update Request' : 'Send Request'}
          </Button>
        </div>
      </div>
    </div>
  );
};
