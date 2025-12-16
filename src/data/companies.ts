// Shared company data that can be used across the application
export interface Company {
    id: string;
    name: string;
    address: string;
    email: string;
    password: string;
}

// Initial mock companies data
export const companies: Company[] = [
    {
        id: '1',
        name: 'LeaveFlow Pro Corp',
        address: '123 Business St, Tech City, TC 12345',
        email: 'admin@leaveflowpro.com',
        password: '********',
    },
    {
        id: '2',
        name: 'Tech Solutions Inc',
        address: '456 Innovation Ave, Silicon Valley, CA 94025',
        email: 'contact@techsolutions.com',
        password: '********',
    },
    {
        id: '3',
        name: 'Innovation Labs',
        address: '789 Research Blvd, Boston, MA 02101',
        email: 'info@innovationlabs.com',
        password: '********',
    },
];
