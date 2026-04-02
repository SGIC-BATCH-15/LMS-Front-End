import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, LoginRequest } from '@/types';
import { permissions as initialPermissions, defaultRolePermissions, Permission } from '@/data/permissions';
import apiClient from '@/components/services/apiClient';
import { useToast } from '@/hooks/use-toast';

interface Role {
    key: string;
    name: string;
    description: string;
    color: string;
}

interface AuthContextType {
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    hasPermission: (permissionId: string) => boolean;

    // Role Management (Legacy or Frontend-Specific)
    rolePermissions: Record<UserRole, Set<string>>;
    updateRolePermission: (role: UserRole, permissionId: string, hasAccess: boolean) => void;
    roles: Role[];
    permissions: Permission[];
    addPermission: (permission: Permission) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const rolesList: Role[] = [
    { key: 'admin', name: 'Administrator', description: 'Full system access', color: 'bg-indigo-500' },
    { key: 'manager', name: 'Manager', description: 'Team management access', color: 'bg-blue-500' },
    { key: 'staff', name: 'Staff', description: 'Standard employee access', color: 'bg-green-500' },
    { key: 'employee', name: 'Employee', description: 'Basic access', color: 'bg-gray-500' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Set<string>>>({
        admin: new Set(),
        manager: new Set(),
        staff: new Set(),
        employee: new Set()
    });
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    };

    const DEMO_MODE = true; // Demo mode: local mock login and permission filling

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            if (DEMO_MODE) {
                const normalizedEmail = email.trim().toLowerCase();

                if (normalizedEmail === 'admin@gmail.com' && password === 'admin') {
                    const userData: User = {
                        id: 'demo-admin',
                        name: 'Admin User',
                        firstName: 'Admin',
                        lastName: 'User',
                        email: 'admin@gmail.com',
                        role: 'admin',
                        departmentId: 'demo-dept',
                        designation: 'Administrator',
                        joinDate: new Date().toISOString(),
                        currentExperience: 5,
                        previousExperience: 0
                    };

                    localStorage.setItem('authToken', 'demo-token');
                    localStorage.setItem('user', JSON.stringify(userData));
                    setCurrentUser(userData);
                    return true;
                }

                throw new Error('Invalid email or password');
            }

            const response = await apiClient.post('/auth/login', { email, password });
            const { accessToken } = response.data?.data || {};

            if (!accessToken) {
                throw new Error('No access token received');
            }

            const payloadUser = response.data.data;
            const userData: User = {
                id: payloadUser.id || '0',
                name: payloadUser.name || 'User',
                firstName: payloadUser.firstName || 'User',
                lastName: payloadUser.lastName || '',
                email,
                role: (payloadUser.role || 'employee').toLowerCase(),
                departmentId: payloadUser.departmentId || '0',
                designation: payloadUser.designation || '',
                joinDate: new Date().toISOString(),
                currentExperience: 0,
                previousExperience: 0
            };

            localStorage.setItem('authToken', accessToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setCurrentUser(userData);
            return true;
        } catch (error: any) {
            console.error('Login error:', error);
            toast({
                title: 'Login Failed',
                description: error.message || 'Invalid credentials',
                variant: 'destructive',
            });
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setCurrentUser(null);
    };

    const hasPermission = (permissionId: string): boolean => {
        // Legacy permission check bypass. 
        // We now rely on RolePrivilegeContext (backend-driven) for sidebar visibility.
        // Returning true allows the 'filterItems' in Sidebar to proceed to step 4 (Role-based check).
        return true;
    };

    const updateRolePermission = (role: UserRole, permissionId: string, hasAccess: boolean) => {
        setRolePermissions(prev => {
            const newSet = new Set(prev[role]);
            if (hasAccess) {
                newSet.add(permissionId);
            } else {
                newSet.delete(permissionId);
            }
            return { ...prev, [role]: newSet };
        });
    };

    const addPermission = (permission: Permission) => {
        setPermissions(prev => [...prev, permission]);
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            isAuthenticated: !!currentUser,
            isLoading,
            login,
            logout,
            hasPermission,
            rolePermissions,
            updateRolePermission,
            roles: rolesList,
            permissions,
            addPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
