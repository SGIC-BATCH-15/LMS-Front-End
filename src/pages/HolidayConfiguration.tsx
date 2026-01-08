import React, { useState, useEffect } from 'react';
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
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';
import { useHolidays } from '@/context/HolidayContext';
import { companies } from '@/data/companies';
import { Holiday } from '@/types';
import { toast } from "sonner";
import { initialHolidays } from '@/data/holidays';

const daysOfWeek = [
    { id: 0, label: 'Sunday' },
    { id: 1, label: 'Monday' },
    { id: 2, label: 'Tuesday' },
    { id: 3, label: 'Wednesday' },
    { id: 4, label: 'Thursday' },
    { id: 5, label: 'Friday' },
    { id: 6, label: 'Saturday' },
];

export const HolidayConfiguration = () => {
    const { hasPermission } = useAuth();
    const {
        holidays,
        weeklyOffs,
        addHoliday,
        deleteHoliday,
        updateWeeklyOffs
    } = useHolidays();

    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
    const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // New Holiday Form State
    const [newHolidayName, setNewHolidayName] = useState('');
    const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>(undefined);
    const [newHolidayType, setNewHolidayType] = useState<'public' | 'restricted'>('public');

    if (!hasPermission('system_settings')) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        );
    }

    const currentCompanyHolidays = holidays.filter(h => h.companyId === selectedCompanyId);
    const currentCompanyWeeklyOff = weeklyOffs.find(w => w.companyId === selectedCompanyId) || { id: 'new', companyId: selectedCompanyId, days: [] };
    const [tempDays, setTempDays] = useState<number[]>([]);

    useEffect(() => {
        setTempDays(currentCompanyWeeklyOff.days);
    }, [selectedCompanyId, weeklyOffs]);

    const handleAddHoliday = () => {
        if (!newHolidayName || !newHolidayDate) {
            toast.error("Please provide both name and date for the holiday.");
            return;
        }

        const newHoliday: Holiday = {
            id: Math.random().toString(36).substr(2, 9),
            name: newHolidayName,
            date: newHolidayDate,
            companyId: selectedCompanyId,
            type: newHolidayType,
        };

        addHoliday(newHoliday);
        setNewHolidayName('');
        setNewHolidayDate(undefined);
        setNewHolidayType('public');
        setIsAddHolidayOpen(false);
        toast.success("Holiday added successfully");
    };

    const handleDeleteHoliday = (id: string) => {
        deleteHoliday(id);
        toast.success("Holiday removed");
    };

    const toggleWeeklyOffDay = (dayId: number) => {
        if (tempDays.includes(dayId)) {
            setTempDays(tempDays.filter(d => d !== dayId));
        } else {
            setTempDays([...tempDays, dayId]);
        }
    };

    const handleSaveWeeklyOffs = () => {
        updateWeeklyOffs({
            ...currentCompanyWeeklyOff,
            days: tempDays,
            id: currentCompanyWeeklyOff.id === 'new' ? Math.random().toString() : currentCompanyWeeklyOff.id,
            companyId: selectedCompanyId
        });
        toast.success("Weekly off settings updated");
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
