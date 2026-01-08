import { Holiday } from '@/types';

// Mock initial data
export const initialHolidays: Holiday[] = [
    { id: '1', name: 'New Year', date: new Date(2024, 0, 1), companyId: '1', type: 'public' },
    { id: '2', name: 'Christmas', date: new Date(2024, 11, 25), companyId: '1', type: 'public' },
];
