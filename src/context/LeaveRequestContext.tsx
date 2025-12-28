import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LeaveRequest } from '@/types';
import { leaveRequests as initialLeaveRequests } from '@/data/mockData';

interface LeaveRequestContextType {
    leaveRequests: LeaveRequest[];
    addLeaveRequest: (request: LeaveRequest) => void;
    updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;
}

const LeaveRequestContext = createContext<LeaveRequestContextType | undefined>(undefined);

export const LeaveRequestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);

    const addLeaveRequest = (request: LeaveRequest) => {
        setLeaveRequests(prev => [request, ...prev]);
    };

    const updateLeaveRequest = (id: string, updates: Partial<LeaveRequest>) => {
        setLeaveRequests(prev =>
            prev.map(req => (req.id === id ? { ...req, ...updates } : req))
        );
    };

    return (
        <LeaveRequestContext.Provider value={{ leaveRequests, addLeaveRequest, updateLeaveRequest }}>
            {children}
        </LeaveRequestContext.Provider>
    );
};

export const useLeaveRequests = () => {
    const context = useContext(LeaveRequestContext);
    if (context === undefined) {
        throw new Error('useLeaveRequests must be used within a LeaveRequestProvider');
    }
    return context;
};
