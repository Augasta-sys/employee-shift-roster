
import { useState } from "react";
import type { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  onSearch: (value: string) => void;
}

const DashboardLayout = ({
  children,
  onSearch,
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
  <div className="flex h-dvh w-full gap-3 overflow-hidden bg-slate-100 p-3 dark:bg-slate-950">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
          onSearch={onSearch}
        />

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-2xl">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
