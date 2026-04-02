import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { permissions, defaultRolePermissions } from '@/data/permissions';

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

    const DEMO_MODE = true;

    const fetchPrivileges = async () => {
        if (!isAuthenticated || !currentUser) {
            setPrivileges(new Set());
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (DEMO_MODE) {
                if (currentUser.role === 'admin') {
                    const allCodes = new Set(permissions.map((p) => p.id.toUpperCase()));
                    setPrivileges(allCodes);
                } else {
                    const roleCodes = defaultRolePermissions[currentUser.role]?.size
                        ? Array.from(defaultRolePermissions[currentUser.role]).map((id) => id.toUpperCase())
                        : [];
                    setPrivileges(new Set(roleCodes));
                }
                return;
            }

            // Non-demo fallback path can be configured later. For now, no backend calls in demo.
            setPrivileges(new Set());
        } catch (err: any) {
            console.error('Failed to load company privileges:', err);
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
        if (!isAuthenticated || !currentUser) return false;
        if (currentUser.role === 'admin') return true;
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