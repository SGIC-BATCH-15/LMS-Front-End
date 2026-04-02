import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { permissions as rolePermissionList, defaultRolePermissions } from '@/data/permissions';

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

    const DEMO_MODE = true;

    const fetchPrivileges = async () => {
        if (!currentUser) {
            setRolePrivileges([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            if (DEMO_MODE) {
                const effectivePrivileges: RolePrivilege[] = [];
                const role = currentUser.role || 'employee';

                if (role === 'admin') {
                    rolePermissionList.forEach((perm, index) => {
                        effectivePrivileges.push({
                            id: index + 1,
                            roleId: 1,
                            roleName: 'Admin',
                            privilegeId: index + 1,
                            privilegeName: perm.name,
                            privilegeCode: perm.id.toUpperCase(),
                            canRead: true,
                            canWrite: true,
                            canUpdate: true,
                            canDelete: true
                        });
                    });
                } else {
                    const rolePermSet = defaultRolePermissions[role] || new Set();
                    rolePermissionList.forEach((perm, index) => {
                        const has = rolePermSet.has(perm.id);
                        effectivePrivileges.push({
                            id: index + 1,
                            roleId: role === 'manager' ? 2 : role === 'staff' ? 3 : 4,
                            roleName: role.charAt(0).toUpperCase() + role.slice(1),
                            privilegeId: index + 1,
                            privilegeName: perm.name,
                            privilegeCode: perm.id.toUpperCase(),
                            canRead: has,
                            canWrite: has,
                            canUpdate: has,
                            canDelete: has
                        });
                    });
                }

                setRolePrivileges(effectivePrivileges);
                return;
            }

            // Fallback to backend API when demo mode is off
            const [roleRes, userRes] = await Promise.all([
                apiClient.get('/settings/role-privileges/get'),
                apiClient.get('/settings/user-privileges/mine')
            ]);

            let effectivePrivileges: RolePrivilege[] = [];

            if (roleRes.data && roleRes.data.data) {
                const allRolePrivileges = roleRes.data.data as RolePrivilege[];
                const userRole = currentUser.role || '';
                effectivePrivileges = allRolePrivileges.filter(rp =>
                    rp.roleName.toLowerCase() === userRole.toLowerCase()
                );
            }

            if (userRes.data && userRes.data.data) {
                const userPrivileges = userRes.data.data as UserPrivilege[];
                const privMap = new Map<string, RolePrivilege>();
                effectivePrivileges.forEach(rp => privMap.set(rp.privilegeCode, rp));

                userPrivileges.forEach(up => {
                    const existing = privMap.get(up.privilegeCode);
                    if (existing) {
                        privMap.set(up.privilegeCode, {
                            ...existing,
                            canRead: up.canRead,
                            canWrite: up.canWrite,
                            canUpdate: up.canUpdate,
                            canDelete: up.canDelete
                        });
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
