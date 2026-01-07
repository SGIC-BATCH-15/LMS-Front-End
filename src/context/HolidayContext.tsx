import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Holiday, WeeklyOff } from '@/types';
import { initialHolidays } from '@/data/holidays';

interface HolidayContextType {
    holidays: Holiday[];
    weeklyOffs: WeeklyOff[];
    addHoliday: (holiday: Holiday) => void;
    deleteHoliday: (id: string) => void;
    updateWeeklyOffs: (weeklyOff: WeeklyOff) => void;
    getCompanyHolidays: (companyId: string) => Holiday[];
    getCompanyWeeklyOff: (companyId: string) => WeeklyOff | undefined;
}

const HolidayContext = createContext<HolidayContextType | undefined>(undefined);

export const useHolidays = () => {
    const context = useContext(HolidayContext);
    if (!context) {
        throw new Error('useHolidays must be used within a HolidayProvider');
    }
    return context;
};

// Mock initial weekly offs
const initialWeeklyOffs: WeeklyOff[] = [
    { id: '1', companyId: '1', days: [0, 6] }, // Sunday, Saturday
    { id: '2', companyId: '2', days: [0] },    // Sunday
    { id: '3', companyId: '3', days: [0, 6] },
];

export const HolidayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays);
    const [weeklyOffs, setWeeklyOffs] = useState<WeeklyOff[]>(initialWeeklyOffs);

    const addHoliday = (holiday: Holiday) => {
        setHolidays([...holidays, holiday]);
    };

    const deleteHoliday = (id: string) => {
        setHolidays(holidays.filter(h => h.id !== id));
    };

    const updateWeeklyOffs = (updatedWeeklyOff: WeeklyOff) => {
        setWeeklyOffs(prev => {
            const existingIndex = prev.findIndex(w => w.companyId === updatedWeeklyOff.companyId);
            if (existingIndex >= 0) {
                const newOffs = [...prev];
                newOffs[existingIndex] = updatedWeeklyOff;
                return newOffs;
            }
            return [...prev, updatedWeeklyOff];
        });
    };

    const getCompanyHolidays = (companyId: string) => {
        return holidays.filter(h => h.companyId === companyId);
    };

    const getCompanyWeeklyOff = (companyId: string) => {
        return weeklyOffs.find(w => w.companyId === companyId);
    };

    return (
        <HolidayContext.Provider value={{
            holidays,
            weeklyOffs,
            addHoliday,
            deleteHoliday,
            updateWeeklyOffs,
            getCompanyHolidays,
            getCompanyWeeklyOff
        }}>
            {children}
        </HolidayContext.Provider>
    );
};
