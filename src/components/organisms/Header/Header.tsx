import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { notifications } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
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
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showApplyButton = true, actions }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <header className="h-[72px] bg-white border-b border-border px-6 flex items-center">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>


        <div className="flex items-center gap-4">
          {actions}

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

          {showApplyButton && (
            <Button onClick={() => navigate('/apply-leave')} className="gap-2">
              <Plus className="w-4 h-4" />
              Apply Leave
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
