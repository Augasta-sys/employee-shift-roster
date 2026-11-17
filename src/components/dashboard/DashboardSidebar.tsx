
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock3,
  CalendarCheck,
  Repeat,
  CalendarDays,
  Bell,
  BarChart3,
  X,
  CalendarRange,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "manager", "employee"],
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        label: "Employees",
        path: "/employees",
        icon: Users,
        roles: ["admin"],
      },
      {
        label: "Departments",
        path: "/departments",
        icon: Building2,
        roles: ["admin"],
      },
      {
        label: "Shifts",
        path: "/shifts",
        icon: Clock3,
        roles: ["admin", "manager"],
      },
      {
        label: "Assignments",
        path: "/assignments",
        icon: CalendarCheck,
        roles: ["admin", "manager", "employee"],
      },
      {
        label: "Rotation Rules",
        path: "/rotations",
        icon: Repeat,
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    title: "SCHEDULE",
    items: [
      {
        label: "Roster Calendar",
        path: "/roster",
        icon: CalendarDays,
        roles: ["admin", "manager", "employee"],
      },
      {
        label: "My Schedule",
        path: "/my-schedule",
        icon: CalendarRange,
        roles: ["admin", "manager", "employee"],
      },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      {
        label: "Notifications",
        path: "/notifications",
        icon: Bell,
        roles: ["admin", "manager", "employee"],
      },
      {
        label: "Reports",
        path: "/reports",
        icon: BarChart3,
        roles: ["admin", "manager"],
      },
    ],
  },
];

const DashboardSidebar = ({
  open,
  onClose,
}: DashboardSidebarProps) => {
  const { user } = useAuth();

  const userRole = user?.role;

  const visibleNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        userRole ? item.roles.includes(userRole) : false
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col overflow-hidden rounded-r-2xl border transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:rounded-2xl ${
          open ? "translate-x-0" : "-translate-x-full"
        } border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900`}
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
              <CalendarDays size={22} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                ShiftSync
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Workforce Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-scroll flex-1 space-y-6 overflow-y-auto px-3 py-6">
          {visibleNavigation.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/dashboard"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/20"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        }`
                      }
                    >
                      <Icon size={18} strokeWidth={1.9} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 p-3 dark:from-slate-800 dark:to-slate-800">
            <p className="text-xs font-semibold text-slate-800 dark:text-white">
              ShiftSync Workspace
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              Manage teams, shifts and schedules in one place.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
