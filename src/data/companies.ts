// Shared company data that can be used across the application
export interface Company {
    id: string;
    name?: string; // Optional for backward compatibility
    companyName?: string; // Backend uses this field
    address?: string;
    email?: string;
    phoneNumber?: string;
}

// Initial mock companies data
export const companies: Company[] = [
    {
        id: '1',
        name: 'LeaveFlow Pro Corp',
        address: '123 Business St, Tech City, TC 12345',
        email: 'admin@leaveflowpro.com',
        phoneNumber: '+1 (555) 123-4567',
    },
    {
        id: '2',
        name: 'Tech Solutions Inc',
        address: '456 Innovation Ave, Silicon Valley, CA 94025',
        email: 'contact@techsolutions.com',
        phoneNumber: '+1 (555) 987-6543',
    },
    {
        id: '3',
        name: 'Innovation Labs',
        address: '789 Research Blvd, Boston, MA 02101',
        email: 'info@innovationlabs.com',
        phoneNumber: '+1 (555) 456-7890',
    },
];
