
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  onSearch: (value: string) => void;
}

const DashboardHeader = ({
  onMenuClick,
  onSearch,
}: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const isDark = theme === "dark";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <header className="relative z-30 flex h-[76px] shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="hidden min-w-0 sm:block">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Workspace Overview
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mx-auto hidden w-full max-w-[340px] md:block">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search dashboard data..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Bell size={19} />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="hidden text-left lg:block">
              <p className="max-w-[120px] truncate text-xs font-semibold text-slate-800 dark:text-white">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] capitalize text-slate-500 dark:text-slate-400">
                {user?.role || "Employee"}
              </p>
            </div>

            <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close user menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/lock-screen");
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <UserCircle size={17} />
                  Lock Screen
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut size={17} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
