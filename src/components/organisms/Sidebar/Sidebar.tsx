import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/atoms/Avatar/UserAvatar';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  CheckSquare,
  Users,
  Building2,
  Shield,
  Tags,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,

  FolderOpen,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MenuItem {
  to?: string;
  label: string;
  icon: any;
  children?: MenuItem[];
  roles?: string[];
  permission?: string;
}

const getNavItems = (): MenuItem[] => {
  return [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
    { to: '/employees', label: 'Employees', icon: Users, permission: 'manage_employees' },
    {
      label: 'Leave Management',
      icon: FolderOpen,
      children: [
        { to: '/apply-leave', label: 'Apply Leave', icon: CalendarPlus, permission: 'apply_leave' },
        { to: '/leave-types', label: 'Leave Types', icon: Tags, permission: 'manage_leave_types' },
        { to: '/my-leaves', label: 'Leave Requests', icon: CalendarDays, permission: 'view_own_leaves' },
        { to: '/approvals', label: 'Approvals', icon: CheckSquare, permission: 'approve_leaves' },
      ],
    },
    { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'view_reports' },
    {
      label: 'Settings',
      icon: Settings,
      permission: 'system_settings', // Parent permission req
      children: [
        { to: '/company', label: 'Company', icon: Building2, permission: 'system_settings' },
        { to: '/departments', label: 'Departments', icon: Building2, permission: 'manage_departments' },
        { to: '/designations', label: 'Designations', icon: Tags, permission: 'manage_designations' },
        { to: '/roles', label: 'Roles', icon: UserCog, permission: 'manage_roles' },
        { to: '/roles-permissions', label: 'Roles & Permissions', icon: Shield, permission: 'manage_roles' },
        { to: '/leave-policies', label: 'Leave Policies', icon: FileText, permission: 'manage_policies' },
      ],
    },
  ];
};

export const Sidebar: React.FC = () => {
  const { currentUser, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If no user is authenticated, don't render the sidebar
  if (!currentUser) {
    return null;
  }

  const navItems = getNavItems();

  const filterItems = (items: MenuItem[]): MenuItem[] => {
    return items.reduce((acc: MenuItem[], item) => {
      // Check if user has permission for this item
      if (item.permission && !hasPermission(item.permission)) {
        return acc;
      }

      // If item has children, filter them recursively
      if (item.children) {
        const filteredChildren = filterItems(item.children);
        // If no children remain after filtering, and it's a group (no 'to'), exclude it
        if (filteredChildren.length === 0 && !item.to) {
          return acc;
        }
        return [...acc, { ...item, children: filteredChildren }];
      }

      return [...acc, item];
    }, []);
  };

  const filteredNavItems = filterItems(navItems);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Auto-expand group when its child page is active
  React.useEffect(() => {
    filteredNavItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => child.to === location.pathname);
        if (hasActiveChild && !expandedGroups.includes(item.label)) {
          setExpandedGroups([item.label]);
        }
      }
    });
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    // Accordion behavior: only one group open at a time
    if (expandedGroups.includes(label)) {
      setExpandedGroups([]);
    } else {
      setExpandedGroups([label]);
    }
  };

  const isGroupExpanded = (label: string) => expandedGroups.includes(label);

  const isPathActive = (path?: string, children?: MenuItem[]) => {
    if (path) {
      return location.pathname === path;
    }
    if (children) {
      return children.some(child => child.to === location.pathname);
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, isChild = false, collapsed = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = hasChildren && isGroupExpanded(item.label) && !collapsed;
    const isActive = isPathActive(item.to, item.children);

    // Check if any child route is currently active
    const hasActiveChild = hasChildren && item.children?.some(child => child.to === location.pathname);

    if (hasChildren) {
      return (
        <div key={item.label} className="mb-1" title={collapsed ? item.label : undefined}>
          <button
            onClick={() => !collapsed && toggleGroup(item.label)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg transition-all duration-200',
              collapsed ? 'justify-center px-3 py-3' : 'justify-between px-4 py-3',
              hasActiveChild || isActive || isExpanded
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-white hover:bg-gray-700'
            )}
          >
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            </div>
            {!collapsed && (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )
            )}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-3 mt-1 space-y-1 pl-4 border-l-2 border-gray-700">
              {item.children.map(child => renderMenuItem(child, true, collapsed))}
            </div>
          )}
        </div>
      );
    }

    if (item.to) {
      return (
        <NavLink
          key={item.to}
          to={item.to}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg transition-all duration-200',
              collapsed ? 'justify-center px-3 py-3' : 'px-4',
              isChild && !collapsed ? 'py-2.5 text-sm' : 'py-3',
              isChild && !collapsed ? 'py-2.5 text-sm' : 'py-3',
              isActive
                ? isChild && !collapsed
                  ? 'bg-white/10 text-white font-medium border-l-4 border-white'
                  : 'bg-white text-gray-900 shadow-sm font-semibold'
                : 'text-white hover:bg-gray-700'
            )
          }
        >
          <item.icon className={cn(
            isChild && !collapsed ? 'w-4 h-4' : 'w-5 h-5',
            'flex-shrink-0'
          )} />
          {!collapsed && <span className={cn('font-medium', !isChild && 'text-sm')}>{item.label}</span>}
        </NavLink>
      );
    }

    return null;
  };

  return (
    <div className={cn(
      "h-screen bg-gray-800 border-r border-gray-700 flex flex-col shadow-xl transition-all duration-300",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LeaveFlow</h1>
              <p className="text-xs text-gray-400">Leave Management</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6 text-gray-900" />
          </div>
        )}
        {/* Toggle Button on the side */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5 rotate-180" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {filteredNavItems.map(item => renderMenuItem(item, false, isCollapsed))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer group",
              isCollapsed && "justify-center"
            )}>
              <div className="relative">
                <UserAvatar name={currentUser.name} size="md" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};
