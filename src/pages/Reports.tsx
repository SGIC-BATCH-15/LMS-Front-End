import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, Calendar, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import apiClient from '@/components/services/apiClient';
import { Department } from '@/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useRolePrivilege } from '@/context/RolePrivilegeContext';

const leaveUsageData = [
    { month: 'Jan', annual: 45, sick: 12, casual: 8 },
    { month: 'Feb', annual: 52, sick: 15, casual: 10 },
    { month: 'Mar', annual: 48, sick: 18, casual: 12 },
    { month: 'Apr', annual: 61, sick: 10, casual: 9 },
    { month: 'May', annual: 55, sick: 14, casual: 11 },
    { month: 'Jun', annual: 67, sick: 16, casual: 13 },
];

const departmentData = [
    { name: 'Engineering', value: 45, color: '#3b82f6' },
    { name: 'HR', value: 25, color: '#10b981' },
    { name: 'Marketing', value: 20, color: '#f59e0b' },
    { name: 'Finance', value: 15, color: '#ef4444' },
];

const leaveTypeDistribution = [
    { type: 'Annual', count: 328, color: '#3b82f6' },
    { type: 'Sick', count: 85, color: '#ef4444' },
    { type: 'Casual', count: 63, color: '#10b981' },
    { type: 'Other', count: 24, color: '#f59e0b' },
];

const trendData = [
    { month: 'Jan', leaves: 65 },
    { month: 'Feb', leaves: 77 },
    { month: 'Mar', leaves: 78 },
    { month: 'Apr', leaves: 80 },
    { month: 'May', leaves: 80 },
    { month: 'Jun', leaves: 96 },
];

export const Reports: React.FC = () => {
    const { hasRolePrivilege } = useRolePrivilege();
    const [selectedYear, setSelectedYear] = useState('2026');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [totalLeaveRequests, setTotalLeaveRequests] = useState<number>(0);
    const [pendingApprovals, setPendingApprovals] = useState<number>(0);
    const [isLoadingLeaveRequests, setIsLoadingLeaveRequests] = useState(false);
    const [monthlyLeaveData, setMonthlyLeaveData] = useState<any[]>([]);
    const [departmentWiseData, setDepartmentWiseData] = useState<any[]>([]);
    const [leaveTypeSummary, setLeaveTypeSummary] = useState<any[]>([]);
    const [trendAnalysisData, setTrendAnalysisData] = useState<any[]>([]);
    const [allLeaveRequestsForExport, setAllLeaveRequestsForExport] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    // Function to fetch all leave requests with detailed employee data for export
    const fetchAllLeaveRequestsForExport = async () => {
        try {
            let allLeaveRequests: any[] = [];

            if (selectedDepartment === 'all') {
                // Fetch leave requests for all departments
                if (departments.length > 0) {
                    const promises = departments.map(dept =>
                        apiClient.get('/report/leave_request/get_all', {
                            params: { year: selectedYear, departmentId: dept.id }
                        })
                    );

                    const responses = await Promise.all(promises);

                    responses.forEach((response, index) => {
                        const data = response.data.data;
                        const dept = departments[index];
                        if (Array.isArray(data)) {
                            const taggedData = data.map((req: any) => ({
                                ...req,
                                departmentId: dept.id,
                                departmentName: dept.name
                            }));
                            allLeaveRequests = [...allLeaveRequests, ...taggedData];
                        }
                    });
                } else {
                    // If departments haven't loaded yet, try without departmentId
                    const response = await apiClient.get('/report/leave_request/get_all', {
                        params: { year: selectedYear }
                    });
                    const data = response.data.data;
                    if (Array.isArray(data)) {
                        allLeaveRequests = data;
                    }
                }
            } else {
                // Fetch for specific department
                const response = await apiClient.get('/report/leave_request/get_all', {
                    params: { year: selectedYear, departmentId: selectedDepartment }
                });
                const data = response.data.data;

                if (Array.isArray(data)) {
                    allLeaveRequests = data;
                }
            }

            return allLeaveRequests;
        } catch (error) {
            console.error('Error fetching leave requests for export:', error);
            return [];
        }
    };

    // Function to generate and download PDF
    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const leaveRequests = await fetchAllLeaveRequestsForExport();

            if (leaveRequests.length === 0) {
                alert('No leave requests found for the selected filters');
                setIsExporting(false);
                return;
            }

            // Create PDF document
            const doc = new jsPDF();

            // Add title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Leave Requests Report', 14, 22);

            // Add filters info
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            const departmentText = selectedDepartment === 'all' ? 'All Departments' :
                departments.find(d => d.id === selectedDepartment)?.name || 'Unknown Department';
            doc.text(`Year: ${selectedYear} | Department: ${departmentText}`, 14, 32);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);

            // Prepare data for table
            const tableData = leaveRequests.map((request: any) => [
                request.employee?.firstName || request.employeeName || 'N/A',
                request.leaveType?.leaveType || request.leaveTypeName || 'N/A',
                request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A',
                request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A',
                request.status || 'N/A'
            ]);

            // Add table
            autoTable(doc, {
                head: [['Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Status']],
                body: tableData,
                startY: 50,
                styles: {
                    fontSize: 10,
                    cellPadding: 3,
                },
                headStyles: {
                    fillColor: [59, 130, 246], // Blue color
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                columnStyles: {
                    0: { cellWidth: 35 }, // Employee Name
                    1: { cellWidth: 35 }, // Leave Type
                    2: { cellWidth: 30 }, // Start Date
                    3: { cellWidth: 30 }, // End Date
                    4: { cellWidth: 25 }  // Status
                }
            });

            // Add summary at the bottom
            const finalY = (doc as any).lastAutoTable.finalY + 20;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary:', 14, finalY);
            doc.setFont('helvetica', 'normal');

            const totalRequests = leaveRequests.length;
            const pendingCount = leaveRequests.filter((req: any) => req.status === 'PENDING').length;
            const approvedCount = leaveRequests.filter((req: any) => req.status === 'APPROVED').length;
            const rejectedCount = leaveRequests.filter((req: any) => req.status === 'REJECTED').length;

            doc.text(`Total Leave Requests: ${totalRequests}`, 14, finalY + 8);
            doc.text(`Pending Approvals: ${pendingCount}`, 14, finalY + 16);
            doc.text(`Approved Requests: ${approvedCount}`, 14, finalY + 24);
            doc.text(`Rejected Requests: ${rejectedCount}`, 14, finalY + 32);

            // Generate filename with current timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const sanitizedDeptName = departmentText.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const filename = `leave-requests-report-${selectedYear}-${sanitizedDeptName}-${timestamp}.pdf`;

            // Save the PDF
            doc.save(filename);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    // Fetch departments from backend
    useEffect(() => {
        const fetchDepartments = async () => {
            setIsLoadingDepartments(true);
            try {
                const response = await apiClient.get('/settings/department/get_all_department');
                const data = response.data.data;

                if (Array.isArray(data)) {
                    const mappedDepartments = data.map((d: any) => ({
                        id: d.id?.toString(),
                        name: d.name,
                        companyId: d.company_id?.toString() || d.companyId?.toString()
                    }));
                    setDepartments(mappedDepartments);
                } else {
                    setDepartments([]);
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
                setDepartments([]);
            } finally {
                setIsLoadingDepartments(false);
            }
        };

        fetchDepartments();
    }, []);

    // Fetch department-wise distribution data (only depends on year, not department selection)
    useEffect(() => {
        const fetchDepartmentWiseData = async () => {
            if (departments.length === 0) {
                return;
            }

            try {
                const deptRequestCounts: any = {};
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

                // Always fetch for all departments for the pie chart
                const promises = departments.map(dept =>
                    apiClient.get('/report/leave_request/get_all', {
                        params: { year: selectedYear, departmentId: dept.id }
                    })
                );

                const responses = await Promise.all(promises);

                responses.forEach((response, index) => {
                    const data = response.data.data;
                    const dept = departments[index];
                    if (Array.isArray(data)) {
                        deptRequestCounts[dept.id] = {
                            name: dept.name,
                            count: data.length
                        };
                    }
                });

                // Convert to pie chart format
                const deptWiseData = Object.keys(deptRequestCounts)
                    .map((deptId, index) => ({
                        name: deptRequestCounts[deptId].name,
                        value: deptRequestCounts[deptId].count,
                        color: colors[index % colors.length]
                    }))
                    .filter(d => d.value > 0);

                setDepartmentWiseData(deptWiseData);
            } catch (error) {
                console.error('Error fetching department-wise data:', error);
                setDepartmentWiseData([]);
            }
        };

        fetchDepartmentWiseData();
    }, [selectedYear, departments]); // Only depends on year and departments, NOT selectedDepartment

    // Fetch trend analysis data (only depends on year, not department selection)
    useEffect(() => {
        const fetchTrendAnalysisData = async () => {
            if (departments.length === 0) {
                return;
            }

            try {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthlyTrend: any = {};

                // Initialize all months with 0
                monthNames.forEach(month => {
                    monthlyTrend[month] = 0;
                });

                // Fetch for all departments to get total trend
                const promises = departments.map(dept =>
                    apiClient.get('/report/leave_request/get_all', {
                        params: { year: selectedYear, departmentId: dept.id }
                    })
                );

                const responses = await Promise.all(promises);

                // Count total leave requests per month across all departments
                responses.forEach((response) => {
                    const data = response.data.data;
                    if (Array.isArray(data)) {
                        data.forEach((request: any) => {
                            const startDate = new Date(request.startDate);
                            const monthIndex = startDate.getMonth();
                            const month = monthNames[monthIndex];
                            monthlyTrend[month] += 1;
                        });
                    }
                });

                // Convert to array format for chart
                const trendData = monthNames.map(month => ({
                    month: month,
                    leaves: monthlyTrend[month]
                }));

                setTrendAnalysisData(trendData);
            } catch (error) {
                console.error('Error fetching trend analysis data:', error);
                setTrendAnalysisData([]);
            }
        };

        fetchTrendAnalysisData();
    }, [selectedYear, departments]); // Only depends on year and departments

    // Fetch leave requests based on year and department
    useEffect(() => {
        const fetchLeaveRequests = async () => {
            setIsLoadingLeaveRequests(true);
            try {
                let allLeaveRequests: any[] = [];

                if (selectedDepartment === 'all') {
                    // Fetch leave requests for all departments and sum them up
                    let totalCount = 0;
                    let pendingCount = 0;

                    if (departments.length > 0) {
                        // Fetch for each department and sum
                        const promises = departments.map(dept =>
                            apiClient.get('/report/leave_request/get_all', {
                                params: { year: selectedYear, departmentId: dept.id }
                            })
                        );

                        const responses = await Promise.all(promises);

                        responses.forEach((response, index) => {
                            const data = response.data.data;
                            const dept = departments[index];
                            if (Array.isArray(data)) {
                                totalCount += data.length;
                                pendingCount += data.filter((req: any) => req.status === 'PENDING').length;
                                // Tag each request with department info for processing
                                const taggedData = data.map((req: any) => ({
                                    ...req,
                                    departmentId: dept.id,
                                    departmentName: dept.name
                                }));
                                allLeaveRequests = [...allLeaveRequests, ...taggedData];
                            }
                        });
                    } else {
                        // If departments haven't loaded yet, try without departmentId
                        const response = await apiClient.get('/report/leave_request/get_all', {
                            params: { year: selectedYear }
                        });
                        const data = response.data.data;
                        if (Array.isArray(data)) {
                            totalCount = data.length;
                            pendingCount = data.filter((req: any) => req.status === 'PENDING').length;
                            allLeaveRequests = data;
                        }
                    }

                    setTotalLeaveRequests(totalCount);
                    setPendingApprovals(pendingCount);
                } else {
                    // Fetch for specific department
                    const response = await apiClient.get('/report/leave_request/get_all', {
                        params: { year: selectedYear, departmentId: selectedDepartment }
                    });
                    const data = response.data.data;

                    if (Array.isArray(data)) {
                        setTotalLeaveRequests(data.length);
                        setPendingApprovals(data.filter((req: any) => req.status === 'PENDING').length);
                        allLeaveRequests = data;
                    } else {
                        setTotalLeaveRequests(0);
                        setPendingApprovals(0);
                    }
                }

                // Process monthly data for chart
                const monthlyData = processMonthlyLeaveData(allLeaveRequests);
                setMonthlyLeaveData(monthlyData);

                // Process leave type summary
                const leaveTypeSummaryData = processLeaveTypeSummary(allLeaveRequests);
                setLeaveTypeSummary(leaveTypeSummaryData);

            } catch (error) {
                console.error('Error fetching leave requests:', error);
                setTotalLeaveRequests(0);
                setPendingApprovals(0);
                setMonthlyLeaveData([]);
                setLeaveTypeSummary([]);
            } finally {
                setIsLoadingLeaveRequests(false);
            }
        };

        fetchLeaveRequests();
    }, [selectedYear, selectedDepartment, departments]);

    // Process leave type summary
    const processLeaveTypeSummary = (leaveRequests: any[]) => {
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
        const leaveTypeCounts: any = {};

        // Count leave requests by type
        leaveRequests.forEach((request: any) => {
            const leaveType = request.leaveType?.leaveType || 'Other';
            if (!leaveTypeCounts[leaveType]) {
                leaveTypeCounts[leaveType] = 0;
            }
            leaveTypeCounts[leaveType] += 1;
        });

        // Convert to array format
        return Object.keys(leaveTypeCounts)
            .map((type, index) => ({
                type: type,
                count: leaveTypeCounts[type],
                color: colors[index % colors.length]
            }))
            .sort((a, b) => b.count - a.count); // Sort by count descending
    };

    // Process leave requests into monthly data grouped by leave type
    const processMonthlyLeaveData = (leaveRequests: any[]) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyStats: any = {};

        // Initialize all months
        monthNames.forEach(month => {
            monthlyStats[month] = {};
        });

        // Count leave requests by month and type
        leaveRequests.forEach((request: any) => {
            const startDate = new Date(request.startDate);
            const monthIndex = startDate.getMonth();
            const month = monthNames[monthIndex];
            const leaveType = request.leaveType?.leaveType || 'Other';

            if (!monthlyStats[month][leaveType]) {
                monthlyStats[month][leaveType] = 0;
            }
            monthlyStats[month][leaveType] += 1;
        });

        // Get unique leave types
        const leaveTypeSet = new Set<string>();
        leaveRequests.forEach((request: any) => {
            const leaveType = request.leaveType?.leaveType || 'Other';
            leaveTypeSet.add(leaveType);
        });

        // Convert to array format for chart
        return monthNames.map(month => {
            const monthData: any = { month };
            leaveTypeSet.forEach(leaveType => {
                monthData[leaveType] = monthlyStats[month][leaveType] || 0;
            });
            return monthData;
        });
    };

    // Process department-wise distribution data
    const processDepartmentWiseData = (allLeaveRequests: any[]) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
        const deptCounts: any = {};

        // If a specific department is selected, show only that department
        if (selectedDepartment !== 'all') {
            const selectedDept = departments.find(d => d.id === selectedDepartment);
            if (selectedDept && allLeaveRequests.length > 0) {
                return [{
                    name: selectedDept.name,
                    value: allLeaveRequests.length,
                    color: colors[0]
                }];
            }
            return [];
        }

        // For 'all' departments, we already fetched data per department in the API calls
        // Count based on which department API call returned the data
        departments.forEach((dept, index) => {
            // Count will be determined during the fetch process
            deptCounts[dept.id] = {
                name: dept.name,
                count: 0,
                color: colors[index % colors.length]
            };
        });

        // Since we're making separate API calls per department, 
        // we need to track counts during the fetch
        // For now, distribute the leave requests evenly as a fallback
        // This will be updated when we have the proper counts
        const totalRequests = allLeaveRequests.length;

        // Try to determine department from the structure if available
        allLeaveRequests.forEach((request: any) => {
            // The request might have department info in different places
            const deptId = request.departmentId || request.department?.id || request.employee?.departmentId;
            if (deptId) {
                const dept = departments.find(d => d.id === deptId.toString());
                if (dept) {
                    if (!deptCounts[dept.id]) {
                        deptCounts[dept.id] = {
                            name: dept.name,
                            count: 0,
                            color: colors[departments.indexOf(dept) % colors.length]
                        };
                    }
                    deptCounts[dept.id].count += 1;
                }
            }
        });

        // Convert to array format for pie chart
        return Object.keys(deptCounts)
            .map(deptId => ({
                name: deptCounts[deptId].name,
                value: deptCounts[deptId].count,
                color: deptCounts[deptId].color
            }))
            .filter(d => d.value > 0); // Only include departments with leave requests
    };

    const stats = [
        { title: 'Total Leave Requests', value: isLoadingLeaveRequests ? '...' : totalLeaveRequests.toString(), change: '+12%', icon: Calendar, color: 'text-blue-600' },
        { title: 'Pending Approvals', value: isLoadingLeaveRequests ? '...' : pendingApprovals.toString(), change: '-5%', icon: TrendingUp, color: 'text-orange-600' },
    ];

    return (
        <DashboardLayout title="Reports & Analytics" subtitle="Leave usage statistics and insights">
            <div className="space-y-6">
                <div className="flex justify-end items-center">
                    <div className="flex gap-2">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2026">2026</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {isLoadingDepartments ? (
                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : (
                                    departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {hasRolePrivilege('VIEW_REPORTS', 'canWrite') && (
                            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
                                <Download className="w-4 h-4 mr-2" />
                                {isExporting ? 'Exporting...' : 'Export'}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold mt-2">{stat.value}</p>
                                    </div>
                                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave Usage by Type</CardTitle>
                            <CardDescription>Monthly breakdown of leave types</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyLeaveData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    {monthlyLeaveData.length > 0 && Object.keys(monthlyLeaveData[0])
                                        .filter(key => key !== 'month')
                                        .map((leaveType, index) => {
                                            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
                                            return (
                                                <Bar
                                                    key={leaveType}
                                                    dataKey={leaveType}
                                                    fill={colors[index % colors.length]}
                                                    name={leaveType}
                                                />
                                            );
                                        })
                                    }
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Department-wise Distribution</CardTitle>
                            <CardDescription>Leave requests by department</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={departmentWiseData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {departmentWiseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Leave Trend Analysis</CardTitle>
                            <CardDescription>Monthly leave request trend</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trendAnalysisData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="leaves" stroke="#8b5cf6" strokeWidth={2} name="Total Leaves" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Leave Type Summary</CardTitle>
                            <CardDescription>Total requests by leave type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {leaveTypeSummary.length > 0 ? (
                                    leaveTypeSummary.map((item) => (
                                        <div key={item.type} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                                                <span className="font-medium">{item.type}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{item.count}</p>
                                                <p className="text-xs text-muted-foreground">requests</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                        No leave requests found
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout >
    );
};
