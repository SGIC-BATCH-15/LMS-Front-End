import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notifications } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { useCompanyPrivilege } from '@/context/CompanyPrivilegeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showApplyButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showApplyButton = true }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const { hasPrivilege } = useCompanyPrivilege();

  // Button is shown only if prop is true AND user has the privilege
  const canApplyLeave = showApplyButton && hasPrivilege('APPLY_LEAVE');

  return (
    <header className="h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {canApplyLeave && (
          <Button onClick={() => navigate('/apply-leave')} className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Apply Leave
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <p className="px-3 py-2 text-sm font-medium border-b border-border">Notifications</p>
            {userNotifications.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No notifications</p>
            ) : (
              userNotifications.slice(0, 5).map((notif) => (
                <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3">
                  <p className="text-sm font-medium">{notif.title}</p>
                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
