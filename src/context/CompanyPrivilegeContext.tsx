import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getMyCompanyPrivileges } from '@/components/services/currentUserPrivilegeService';

interface CompanyPrivilegeContextType {
    privileges: Set<string>;
    hasPrivilege: (privilegeCode: string) => boolean;
    isLoading: boolean;
    error: string | null;
    refreshPrivileges: () => Promise<void>;
}

const CompanyPrivilegeContext = createContext<CompanyPrivilegeContextType | undefined>(undefined);

export const CompanyPrivilegeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, currentUser } = useAuth();
    const [privileges, setPrivileges] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPrivileges = async () => {
        // Only fetch if authenticated and we have a user
        if (!isAuthenticated || !currentUser) {
            setPrivileges(new Set());
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const response = await getMyCompanyPrivileges();

            // Extract codes and create a Set for O(1) lookups
            const privilegeCodes = new Set(response.privileges.map((p) => p.code));
            setPrivileges(privilegeCodes);
            // console.log('Company privileges loaded:', privilegeCodes);
        } catch (err: any) {
            console.error('Failed to load company privileges:', err);
            // Don't set error state for 403s/401s as it might be transient during login/logout
            if (err.response?.status !== 401 && err.response?.status !== 403) {
                setError('Failed to load company privileges');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch privileges when user logs in or authentication state changes
    useEffect(() => {
        if (isAuthenticated && currentUser) {
            fetchPrivileges();
        } else {
            setPrivileges(new Set());
        }
    }, [isAuthenticated, currentUser?.id]);

    const hasPrivilege = (privilegeCode: string): boolean => {
        if (!isAuthenticated) return false;
        // Admin roles might bypass this check if desired, but here we strictly follow company privileges
        return privileges.has(privilegeCode);
    };

    return (
        <CompanyPrivilegeContext.Provider
            value={{
                privileges,
                hasPrivilege,
                isLoading,
                error,
                refreshPrivileges: fetchPrivileges,
            }}
        >
            {children}
        </CompanyPrivilegeContext.Provider>
    );
};

export const useCompanyPrivilege = (): CompanyPrivilegeContextType => {
    const context = useContext(CompanyPrivilegeContext);
    if (!context) {
        throw new Error('useCompanyPrivilege must be used within a CompanyPrivilegeProvider');
    }
    return context;
};