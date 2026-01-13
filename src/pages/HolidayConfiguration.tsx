import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';
import { companies } from '@/data/companies';
import { toast } from "sonner";
import {
    addHoliday,
    getHolidays,
    deleteHoliday,
    addWeeklyOff,
    getActiveWeeklyOffs,
    WeeklyOffResponseDto,
    DayOfWeek,
    HolidayType
} from '@/components/holidayServices';

const daysOfWeek = [
    { id: 0, label: 'Sunday', backendValue: 'SUNDAY' },
    { id: 1, label: 'Monday', backendValue: 'MONDAY' },
    { id: 2, label: 'Tuesday', backendValue: 'TUESDAY' },
    { id: 3, label: 'Wednesday', backendValue: 'WEDNESDAY' },
    { id: 4, label: 'Thursday', backendValue: 'THURSDAY' },
    { id: 5, label: 'Friday', backendValue: 'FRIDAY' },
    { id: 6, label: 'Saturday', backendValue: 'SATURDAY' },
] as const;

interface UIHoliday {
    id: number;
    name: string;
    date: Date;
    companyId: number;
    type: 'public' | 'restricted';
}

const parseBackendDate = (dateData: any): Date => {
    if (!dateData) return new Date();
    if (typeof dateData === 'string') return parseISO(dateData);
    if (Array.isArray(dateData) && dateData.length === 3) {
        // Handle [yyyy, MM, dd] format (Month is 0-indexed in JS Date)
        return new Date(dateData[0], dateData[1] - 1, dateData[2]);
    }
    return new Date(dateData);
};

export const HolidayConfiguration = () => {
    const { hasPermission } = useAuth();

    // Use numeric ID for company to match backend if possible, but companies data might be string. 
    // We will parse when sending to backend.
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
    const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // New Holiday Form State
    const [newHolidayName, setNewHolidayName] = useState('');
    const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>(undefined);
    const [newHolidayType, setNewHolidayType] = useState<'public' | 'restricted'>('public');

    // Data State
    const [holidays, setHolidays] = useState<UIHoliday[]>([]);
    const [rawWeeklyOffs, setRawWeeklyOffs] = useState<WeeklyOffResponseDto[]>([]);
    const [tempDays, setTempDays] = useState<number[]>([]);

    const fetchData = useCallback(async () => {
        try {
            // Fetch holidays independently to handle 404/400 (empty list) gracefully
            try {
                const holidaysResponse = await getHolidays();
                const holidaysData = holidaysResponse.data || [];

                const mappedHolidays: UIHoliday[] = holidaysData.map(h => ({
                    id: h.id,
                    name: h.name,
                    date: parseBackendDate(h.date),
                    companyId: h.companyId,
                    type: h.holidayType === 'PUBLIC_HOLIDAY' ? 'public' : 'restricted'
                }));
                setHolidays(mappedHolidays);
            } catch (error: any) {
                // If 404 or 400, it likely means no holidays found. Treat as empty.
                if (error.response && (error.response.status === 404 || error.response.status === 400)) {
                    setHolidays([]);
                } else {
                    console.error("Failed to fetch holidays", error);
                }
            }

            // Fetch weekly offs independently
            try {
                const weeklyOffsResponse = await getActiveWeeklyOffs();
                setRawWeeklyOffs(weeklyOffsResponse.data || []);
            } catch (error: any) {
                if (error.response && (error.response.status === 404 || error.response.status === 400)) {
                    setRawWeeklyOffs([]);
                } else {
                    console.error("Failed to fetch weekly offs", error);
                }
            }

        } catch (error) {
            console.error("Unexpected error in fetchData", error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        // Update tempDays when company changes or data loads
        // Filter active weekly offs for the selected company
        // Note: companies[0].id might be string "1", backend returns number 1.

        const companyIdNum = Number(selectedCompanyId);
        if (!isNaN(companyIdNum)) {
            const companyWeeklyOffs = rawWeeklyOffs.filter(w => w.companyId === companyIdNum && w.isActive);
            const activeServerDays = companyWeeklyOffs.map(w => w.dayOfWeek);

            const activeDayIds = daysOfWeek
                .filter(d => activeServerDays.includes(d.backendValue as any))
                .map(d => d.id);

            setTempDays(activeDayIds);
        } else {
            setTempDays([]);
        }

    }, [selectedCompanyId, rawWeeklyOffs]);


    if (!hasPermission('system_settings')) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        );
    }

    // Filter displayed holidays by selected company
    const currentCompanyHolidays = holidays.filter(h => h.companyId === Number(selectedCompanyId));

    const handleAddHoliday = async () => {
        if (!newHolidayName || !newHolidayDate) {
            toast.error("Please provide both name and date for the holiday.");
            return;
        }

        const backendType: HolidayType = newHolidayType === 'public' ? 'PUBLIC_HOLIDAY' : 'RESTRICTED_HOLIDAY';
        // Ensure date is formatted as yyyy-MM-dd
        const formattedDate = format(newHolidayDate, "yyyy-MM-dd");

        try {
            await addHoliday({
                name: newHolidayName,
                date: formattedDate,
                holidayType: backendType
            });

            toast.success("Holiday added successfully");
            setNewHolidayName('');
            setNewHolidayDate(undefined);
            setNewHolidayType('public');
            setIsAddHolidayOpen(false);
            fetchData();
        } catch (error: any) {
            console.error("Add Holiday Error:", error);

            let errorMessage = "Failed to add holiday";
            // Check if we have a response from the server
            if (error.response && error.response.data) {
                const responseData = error.response.data;

                // The backend Wrapper has { statusCode, statusMessage, data }
                // In errors, 'data' is usually a list of ErrorDetails: [{ timestamp, message, errorCode }]

                if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
                    // Extract the first error message from the list
                    const firstError = responseData.data[0];
                    if (firstError.message) {
                        errorMessage = firstError.message;
                    }
                } else if (responseData.statusMessage) {
                    errorMessage = responseData.statusMessage;
                } else if (responseData.message) {
                    // Fallback for some other error structures
                    errorMessage = responseData.message;
                }
            }
            toast.error(errorMessage);
        }
    };

    const handleDeleteHoliday = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this holiday?")) {
            try {
                await deleteHoliday(id);
                toast.success("Holiday removed");
                fetchData(); // Refresh list
            } catch (error: any) {
                console.error(error);
                const backendMessage = error.response?.data?.statusMessage || "Failed to delete holiday";
                toast.error(backendMessage);
            }
        }
    };

    const toggleWeeklyOffDay = (dayId: number) => {
        if (tempDays.includes(dayId)) {
            setTempDays(tempDays.filter(d => d !== dayId));
        } else {
            setTempDays([...tempDays, dayId]);
        }
    };

    const handleSaveWeeklyOffs = async () => {
        const companyIdNum = Number(selectedCompanyId);
        if (isNaN(companyIdNum)) {
            toast.error("Invalid Company ID");
            return;
        }

        const selectedDayNames = daysOfWeek
            .filter(d => tempDays.includes(d.id))
            .map(d => d.backendValue as DayOfWeek);

        try {
            await addWeeklyOff({
                companyId: companyIdNum,
                daysOfWeek: selectedDayNames,
                year: new Date().getFullYear() // Assuming current year
            });
            toast.success("Weekly off settings updated");
            fetchData();
        } catch (error: any) {
            console.error(error);
            const backendMessage = error.response?.data?.statusMessage || "Failed to update weekly offs";
            toast.error(backendMessage);
        }
    };

    return (
        <DashboardLayout title="Holiday Configuration" subtitle="Manage holidays and weekly off days for companies.">
            <div className="space-y-6">
                <Tabs defaultValue="holidays" className="w-full">
                    <TabsList>
                        <TabsTrigger value="holidays">Holidays</TabsTrigger>
                        <TabsTrigger value="weekly-off">Weekly Off</TabsTrigger>
                    </TabsList>

                    <TabsContent value="holidays" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <Card className="md:col-span-8">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle>Holiday List</CardTitle>
                                    <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Holiday
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Holiday</DialogTitle>
                                                <DialogDescription>
                                                    Add a new holiday for the selected company.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name">Holiday Name</Label>
                                                    <Input
                                                        id="name"
                                                        value={newHolidayName}
                                                        onChange={(e) => setNewHolidayName(e.target.value)}
                                                        placeholder="e.g. Independence Day"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Date</Label>
                                                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal",
                                                                    !newHolidayDate && "text-muted-foreground"
                                                                )}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {newHolidayDate ? format(newHolidayDate, "PPP") : <span>Pick a date</span>}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0">
                                                            <Calendar
                                                                mode="single"
                                                                selected={newHolidayDate}
                                                                onSelect={(date) => {
                                                                    setNewHolidayDate(date);
                                                                    setIsCalendarOpen(false);
                                                                }}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Type</Label>
                                                    <Select value={newHolidayType} onValueChange={(v: 'public' | 'restricted') => setNewHolidayType(v)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="public">Public Holiday</SelectItem>
                                                            <SelectItem value="restricted">Restricted Holiday</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddHolidayOpen(false)}>Cancel</Button>
                                                <Button onClick={handleAddHoliday}>Add Holiday</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </CardHeader>
                                <CardContent>
                                    {currentCompanyHolidays.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No holidays configured for this company.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {currentCompanyHolidays
                                                .sort((a, b) => a.date.getTime() - b.date.getTime())
                                                .map((holiday) => (
                                                    <div
                                                        key={holiday.id}
                                                        className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                                {format(holiday.date, "dd")}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{holiday.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {format(holiday.date, "MMMM yyyy")} • <span className="capitalize">{holiday.type}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDeleteHoliday(holiday.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-4">
                                <CardHeader>
                                    <CardTitle>Calendar View</CardTitle>
                                    <CardDescription>Visual overview of holidays</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Calendar
                                        mode="single"
                                        selected={new Date()}
                                        modifiers={{
                                            holiday: currentCompanyHolidays.map(h => h.date)
                                        }}
                                        modifiersStyles={{
                                            holiday: { color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }
                                        }}
                                        className="rounded-md border shadow"
                                    />
                                    <div className="mt-4 text-sm text-muted-foreground">
                                        <p>Dates with holidays are highlighted.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="weekly-off">
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Off Configuration</CardTitle>
                                <CardDescription>
                                    Select the days that are considered weekly off days for {companies.find(c => c.id === selectedCompanyId)?.name}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {daysOfWeek.map((day) => (
                                        <div key={day.id} className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-accent transition-colors">
                                            <Checkbox
                                                id={`day-${day.id}`}
                                                checked={tempDays.includes(day.id)}
                                                onCheckedChange={() => toggleWeeklyOffDay(day.id)}
                                            />
                                            <Label
                                                htmlFor={`day-${day.id}`}
                                                className="flex-1 cursor-pointer font-medium"
                                            >
                                                {day.label}
                                            </Label>
                                            {tempDays.includes(day.id) && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <Button onClick={handleSaveWeeklyOffs} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        Update Changes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};
