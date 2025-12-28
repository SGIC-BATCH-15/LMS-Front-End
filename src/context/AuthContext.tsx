import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { users } from '@/data/mockData';
import { defaultRolePermissions, permissions as initialPermissions, Permission } from '@/data/permissions';

import { roles as initialRoles, Role } from '@/data/roles';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  rolePermissions: Record<UserRole, Set<string>>;
  updateRolePermission: (role: UserRole, permissionId: string, hasAccess: boolean) => void;
  hasPermission: (permissionId: string) => boolean;
  roles: Role[];
  addRole: (role: Role) => void;
  updateRole: (role: Role) => void;
  deleteRole: (roleId: string) => void;
  permissions: Permission[];
  addPermission: (permission: Permission) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'leaveflow_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, Set<string>>>(defaultRolePermissions);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    // Initialize roles if empty (mock persistence)
    // In a real app this would be an API call
    if (roles.length === 0) {
      setRoles(initialRoles);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    // For demo purposes, find user by email only (password not validated)
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return true;
    }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateRolePermission = (role: UserRole, permissionId: string, hasAccess: boolean) => {
    setRolePermissions(prev => {
      const newPermissions = { ...prev };
      const rolePerms = new Set(newPermissions[role]); // Clone the set

      if (hasAccess) {
        rolePerms.add(permissionId);
      } else {
        rolePerms.delete(permissionId);
      }

      newPermissions[role] = rolePerms;
      return newPermissions;
    });
  };

  const hasPermission = (permissionId: string): boolean => {
    if (!currentUser) return false;
    return rolePermissions[currentUser.role]?.has(permissionId) || false;
  };

  // Role Management Functions
  const addRole = (role: Role) => {
    setRoles(prev => [...prev, role]);
  };

  const updateRole = (updatedRole: Role) => {
    setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
  };

  const deleteRole = (roleId: string) => {
    setRoles(prev => prev.filter(r => r.id !== roleId));
  };

  // Permission Management Functions
  const addPermission = (permission: Permission) => {
    setPermissions(prev => [...prev, permission]);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: currentUser !== null,
      login,
      logout,
      rolePermissions,
      updateRolePermission,
      hasPermission,
      roles,
      addRole,
      updateRole,
      deleteRole,
      permissions,
      addPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
