
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
  Search,
  UserCircle,
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  ClipboardList,
  RefreshCw,
  BellRing,
  Activity,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  onSearch: (value: string) => void;
}

const searchItems = [
  {
    name: "Dashboard",
    description: "View dashboard overview",
    keywords: "dashboard overview home",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Employees",
    description: "Manage employee information",
    keywords: "employees staff employee management",
    path: "/employees",
    icon: Users,
  },
  {
    name: "Departments",
    description: "View and manage departments",
    keywords: "departments department",
    path: "/departments",
    icon: Building2,
  },
  {
    name: "Shifts",
    description: "Manage available shifts",
    keywords: "shifts shift schedule timing",
    path: "/shifts",
    icon: CalendarDays,
  },
  {
    name: "Shift Assignments",
    description: "View employee shift assignments",
    keywords: "assignments assigned roster employee shifts",
    path: "/assignments",
    icon: ClipboardList,
  },
  {
    name: "Rotation Rules",
    description: "Manage shift rotation rules",
    keywords: "rotation rules schedule rotation",
    path: "/rotation-rules",
    icon: RefreshCw,
  },
  {
    name: "Notifications",
    description: "View recent notifications",
    keywords: "notifications alerts messages",
    path: "/notifications",
    icon: BellRing,
  },
  {
    name: "Activity Logs",
    description: "View system activity history",
    keywords: "activity logs history activities",
    path: "/activity-logs",
    icon: Activity,
  },
];

const DashboardHeader = ({
  onMenuClick,
  onSearch,
}: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) return [];

    return searchItems.filter((item) =>
      `${item.name} ${item.description} ${item.keywords}`
        .toLowerCase()
        .includes(query)
    );
  }, [searchValue]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

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
    setSearchOpen(true);
    setActiveIndex(-1);
  };

  const handleSelect = (item: (typeof searchItems)[number]) => {
    setSearchValue(item.name);
    onSearch(item.name);
    setSearchOpen(false);
    navigate(item.path);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchOpen(true);
      setActiveIndex((prev) =>
        Math.min(prev + 1, filteredItems.length - 1)
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selectedItem = filteredItems[activeIndex];

      if (selectedItem) handleSelect(selectedItem);
    }
  };

  const highlightText = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());

    if (index === -1 || !query) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  return (
    <header className="relative z-30 flex h-[76px] shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">

      {/* Left Section */}
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

      {/* Search with Autocomplete */}
      <div
        ref={searchRef}
        className="relative mx-auto hidden w-full max-w-[380px] md:block"
      >
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchValue.trim()) setSearchOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search dashboard data..."
            role="combobox"
            aria-expanded={searchOpen && searchValue.trim().length > 0}
            aria-controls="dashboard-search-results"
            aria-autocomplete="list"
            className="h-10 w-full appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />

          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                onSearch("");
                setSearchOpen(false);
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {searchOpen && searchValue.trim() && (
          <div
            id="dashboard-search-results"
            role="listbox"
            className="absolute left-0 top-full z-[100] mt-2 max-h-[360px] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Search Results
            </p>

            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      activeIndex === index
                        ? "bg-blue-50 dark:bg-blue-500/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">
                        {highlightText(item.name, searchValue.trim())}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-7 text-center">
                <Search
                  size={23}
                  className="mx-auto mb-2 text-slate-400"
                />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  No results found
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try searching for another section.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section */}
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

        {/* User Menu */}
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

            <ChevronDown
              size={15}
              className="hidden text-slate-400 sm:block"
            />
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
