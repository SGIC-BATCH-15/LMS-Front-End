import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '@/components/services/apiClient';

interface RolePrivilege {
    id: number;
    roleId: number;
    roleName: string;
    privilegeId: number;
    privilegeName: string;
    privilegeCode: string;
    canRead: boolean;
    canWrite: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

interface RolePrivilegeContextType {
    rolePrivileges: RolePrivilege[];
    loading: boolean;
    hasRolePrivilege: (privilegeCode: string, action: 'canRead' | 'canWrite' | 'canUpdate' | 'canDelete') => boolean;
    refreshPrivileges: () => Promise<void>;
}

interface UserPrivilege {
    id: number;
    employeeId: number;
    privilegeId: number;
    privilegeCode: string; // Ensure backend sends this
    canRead: boolean;
    canWrite: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

const RolePrivilegeContext = createContext<RolePrivilegeContextType | undefined>(undefined);

export const RolePrivilegeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [rolePrivileges, setRolePrivileges] = useState<RolePrivilege[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPrivileges = async () => {
        if (!currentUser) {
            setRolePrivileges([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch role privileges and user privileges in parallel
            const [roleRes, userRes] = await Promise.all([
                apiClient.get('/settings/role-privileges/get'),
                apiClient.get('/settings/user-privileges/mine')
            ]);

            let effectivePrivileges: RolePrivilege[] = [];

            // 1. Process Role Privileges
            if (roleRes.data && roleRes.data.data) {
                const allRolePrivileges = roleRes.data.data as RolePrivilege[];
                const userRole = currentUser.role || '';

                // Filter by current user's role
                effectivePrivileges = allRolePrivileges.filter(rp =>
                    rp.roleName.toLowerCase() === userRole.toLowerCase()
                );
            }

            // 2. Process User Privileges (Overrides)
            if (userRes.data && userRes.data.data) {
                const userPrivileges = userRes.data.data as UserPrivilege[];

                // Merge/Override logic
                // Create a map for quick lookup of existing role privileges
                const privMap = new Map<string, RolePrivilege>();
                effectivePrivileges.forEach(rp => privMap.set(rp.privilegeCode, rp));

                userPrivileges.forEach(up => {
                    const existing = privMap.get(up.privilegeCode);
                    if (existing) {
                        // Override existing role privilege actions with user privilege actions
                        const merged: RolePrivilege = {
                            ...existing,
                            canRead: up.canRead,
                            canWrite: up.canWrite,
                            canUpdate: up.canUpdate,
                            canDelete: up.canDelete,
                            // we could add a flag here like isOverridden: true
                        };
                        privMap.set(up.privilegeCode, merged);
                    } else {
                        // User has a privilege that is NOT in their role? 
                        // If we want to allow additive privileges:
                        /*
                        const newPriv: RolePrivilege = {
                            id: up.id || 0,
                            roleId: 0, 
                            roleName: 'User-Specific',
                            privilegeId: up.privilegeId,
                            privilegeName: '', // Backend DTO might not send name if not requested, but let's assume valid
                            privilegeCode: up.privilegeCode,
                            canRead: up.canRead,
                            canWrite: up.canWrite,
                            canUpdate: up.canUpdate,
                            canDelete: up.canDelete,
                        };
                        privMap.set(up.privilegeCode, newPriv);
                        */
                        // For now, adhering to "user can set privileges... which enabled in the role".
                        // This implies User Privilege is a SUBSET or Override of existing. 
                        // But if the prompt says "enable option... in user priviliges", maybe they want to ENABLE it even if disabled in Role?
                        // "enabled in role" usually means the row exists. 
                        // I will strictly OVERRIDE. If it's not in Role, I won't add it (based on "enabled in role privileges" constraint earlier).
                        // But wait, the user said "i have only set read for... user... but its working in role... OK".
                        // This implies the user wants the User settings to take effect.
                        // I will only override if it exists in Role (as per my previous Filter page implementation).
                    }
                });

                effectivePrivileges = Array.from(privMap.values());
            }

            setRolePrivileges(effectivePrivileges);

        } catch (error) {
            console.error('Failed to fetch privileges:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchPrivileges();
        }
    }, [currentUser]);

    const hasRolePrivilege = (privilegeCode: string, action: 'canRead' | 'canWrite' | 'canUpdate' | 'canDelete'): boolean => {
        if (!currentUser) return false;

        // Admin has all privileges by default? The task says "Admin role should have the ability to manage..."
        // Usually admin has full access.
        if (currentUser.role === 'admin') return true;

        // Check if any of the user's role privileges match the code and action
        return rolePrivileges.some(rp =>
            rp.privilegeCode === privilegeCode && rp[action] === true
        );
    };

    return (
        <RolePrivilegeContext.Provider value={{ rolePrivileges, loading, hasRolePrivilege, refreshPrivileges: fetchPrivileges }}>
            {children}
        </RolePrivilegeContext.Provider>
    );
};

export const useRolePrivilege = () => {
    const context = useContext(RolePrivilegeContext);
    if (context === undefined) {
        throw new Error('useRolePrivilege must be used within a RolePrivilegeProvider');
    }
    return context;
};
