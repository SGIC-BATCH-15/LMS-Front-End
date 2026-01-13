import React from 'react';
import { Sidebar } from '@/components/organisms/Sidebar/Sidebar';
import { Header } from '@/components/organisms/Header/Header';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  showApplyButton?: boolean;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  showApplyButton = true,
  children,
}) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} showApplyButton={showApplyButton} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
