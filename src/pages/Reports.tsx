import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, Calendar, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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
    const [selectedYear, setSelectedYear] = useState('2025');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const stats = [
        { title: 'Total Leave Requests', value: '500', change: '+12%', icon: Calendar, color: 'text-blue-600' },
        { title: 'Pending Approvals', value: '24', change: '-5%', icon: TrendingUp, color: 'text-orange-600' },
        { title: 'Average Days/Employee', value: '18.5', change: '+3%', icon: Users, color: 'text-green-600' },
        { title: 'Utilization Rate', value: '76%', change: '+8%', icon: BarChart3, color: 'text-purple-600' },
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
                                <SelectItem value="engineering">Engineering</SelectItem>
                                <SelectItem value="hr">HR</SelectItem>
                                <SelectItem value="marketing">Marketing</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold mt-2">{stat.value}</p>
                                        <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
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
                                <BarChart data={leaveUsageData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="annual" fill="#3b82f6" name="Annual" />
                                    <Bar dataKey="sick" fill="#ef4444" name="Sick" />
                                    <Bar dataKey="casual" fill="#10b981" name="Casual" />
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
                                        data={departmentData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {departmentData.map((entry, index) => (
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
                                <LineChart data={trendData}>
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
                                {leaveTypeDistribution.map((item) => (
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
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};
