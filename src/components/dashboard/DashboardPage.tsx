import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Clock3,
  CalendarCheck,
  Repeat,
  ArrowUpRight,
  RefreshCw,
  CalendarDays,
  Activity,
  Bell,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "./DashboardLayout";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: string;
}

interface Department {
  id: string;
  name: string;
  status: string;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color?: string;
  status: string;
}

interface Assignment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  shiftId: string;
  shiftName: string;
  date: string;
  status: string;
  assignedBy: string;
  createdAt: string;
}

interface RotationRule {
  id: string;
  name: string;
  department: string;
  pattern: "weekly" | "monthly";
  startDate: string;
  endDate: string;
  status: string;
  shiftSequence: string[];
}

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  module: string;
  description: string;
  timestamp: string;
}

interface DashboardData {
  employees: Employee[];
  departments: Department[];
  shifts: Shift[];
  assignments: Assignment[];
  rotationRules: RotationRule[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
}

const emptyData: DashboardData = {
  employees: [],
  departments: [],
  shifts: [],
  assignments: [],
  rotationRules: [],
  notifications: [],
  activityLogs: [],
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

const formatTime = (date: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

const getNextRotationDate = (rule: RotationRule): string | null => {
  if (rule.status !== "active") return null;

  const start = new Date(`${rule.startDate}T00:00:00`);
  const end = new Date(`${rule.endDate}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return null;
  }

  const next = new Date(start);

  if (rule.pattern === "weekly") {
    while (next < today) {
      next.setDate(next.getDate() + 7);
    }
  } else {
    while (next < today) {
      next.setMonth(next.getMonth() + 1);
    }
  }

  if (next > end) return null;

  return [
    next.getFullYear(),
    String(next.getMonth() + 1).padStart(2, "0"),
    String(next.getDate()).padStart(2, "0"),
  ].join("-");
};

const DashboardPage = () => {
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        employeesRes,
        departmentsRes,
        shiftsRes,
        assignmentsRes,
        rotationsRes,
        notificationsRes,
        activityRes,
      ] = await Promise.all([
        api.get<Employee[]>("/employees"),
        api.get<Department[]>("/departments"),
        api.get<Shift[]>("/shifts"),
        api.get<Assignment[]>("/assignments"),
        api.get<RotationRule[]>("/rotationRules"),
        api.get<NotificationItem[]>("/notifications"),
        api.get<ActivityLog[]>("/activityLogs"),
      ]);

      setData({
        employees: employeesRes.data,
        departments: departmentsRes.data,
        shifts: shiftsRes.data,
        assignments: assignmentsRes.data,
        rotationRules: rotationsRes.data,
        notifications: notificationsRes.data,
        activityLogs: activityRes.data,
      });
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        "Unable to load dashboard data. Please check whether JSON Server is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const activeEmployees = data.employees.filter(
    (employee) => employee.status.toLowerCase() === "active"
  );

  const activeShifts = data.shifts.filter(
    (shift) => shift.status.toLowerCase() === "active"
  );

  const todayAssignments = data.assignments.filter(
    (assignment) => assignment.date === todayString
  );

  const upcomingRotations = useMemo(() => {
    return data.rotationRules
      .map((rule) => ({
        ...rule,
        nextDate: getNextRotationDate(rule),
      }))
      .filter(
        (rule) =>
          rule.nextDate !== null &&
          rule.nextDate >= todayString
      )
      .sort((a, b) =>
        (a.nextDate || "").localeCompare(b.nextDate || "")
      );
  }, [data.rotationRules, todayString]);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...data.activityLogs]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      )
      .filter((item) =>
        !query
          ? true
          : [
              item.user,
              item.action,
              item.module,
              item.description,
            ].some((value) => value.toLowerCase().includes(query))
      )
      .slice(0, 5);
  }, [data.activityLogs, search]);

  const departmentStats = data.departments.map((department) => ({
    name: department.name,
    count: data.employees.filter(
      (employee) => employee.department === department.name
    ).length,
  }));

  const maxDepartmentCount = Math.max(
    ...departmentStats.map((item) => item.count),
    1
  );

  const shiftStats = data.shifts.map((shift) => ({
    ...shift,
    count: data.assignments.filter(
      (assignment) => assignment.shiftId === shift.id
    ).length,
  }));

  const totalShiftAssignments = shiftStats.reduce(
    (total, shift) => total + shift.count,
    0
  );

  const weeklyStats = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));

    const date = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, "0"),
      String(day.getDate()).padStart(2, "0"),
    ].join("-");

    return {
      label: new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
      }).format(day),
      count: data.assignments.filter(
        (assignment) => assignment.date === date
      ).length,
    };
  });

  const maxWeeklyCount = Math.max(
    ...weeklyStats.map((item) => item.count),
    1
  );

  const recentNotifications = [...data.notifications]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 4);

  const stats = [
    {
      label: "Total Employees",
      value: data.employees.length,
      detail: `${activeEmployees.length} active employees`,
      icon: Users,
      color: "blue",
    },
    {
      label: "Active Shifts",
      value: activeShifts.length,
      detail: `${data.shifts.length} total shifts`,
      icon: Clock3,
      color: "violet",
    },
    {
      label: "Today's Assignments",
      value: todayAssignments.length,
      detail: `${todayAssignments.filter((item) => item.status === "confirmed").length} confirmed`,
      icon: CalendarCheck,
      color: "emerald",
    },
    {
      label: "Upcoming Rotations",
      value: upcomingRotations.length,
      detail: "Scheduled rotation changes",
      icon: Repeat,
      color: "amber",
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  };

  return (
    <DashboardLayout onSearch={setSearch}>
      <div className="mx-auto w-full max-w-[1800px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Overview
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Welcome back, {user?.name?.split(" ")[0] || "Admin"}!
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Here's what's happening with your workforce today.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/30 dark:bg-red-500/10 sm:flex-row sm:items-center">
            <AlertCircle className="shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-300">
                Dashboard data unavailable
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Statistics */}
        {!loading && !error && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {item.label}
                        </p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                          {item.value}
                        </h2>
                      </div>

                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClasses[item.color]}`}
                      >
                        <Icon size={21} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <ArrowUpRight size={14} className="text-emerald-500" />
                      {item.detail}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">

              {/* Weekly assignments */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Weekly Assignments
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Assignments created for the last seven days
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <CalendarDays size={19} />
                  </div>
                </div>

                <div className="mt-7 flex h-48 items-end justify-between gap-3 border-b border-l border-slate-200 px-2 pb-2 dark:border-slate-700">
                  {weeklyStats.map((day) => (
                    <div
                      key={day.label}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {day.count}
                      </span>
                      <div className="flex h-[78%] w-full items-end justify-center">
                        <div
                          className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-blue-600 to-violet-500 transition-all duration-500"
                          style={{
                            height: `${Math.max(
                              (day.count / maxWeeklyCount) * 100,
                              4
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department distribution */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Department Distribution
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Employees by department
                  </p>
                </div>

                <div className="mt-6 space-y-5">
                  {departmentStats.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">
                      No departments available.
                    </p>
                  ) : (
                    departmentStats.map((department, index) => {
                      const colors = [
                        "bg-blue-500",
                        "bg-violet-500",
                        "bg-emerald-500",
                        "bg-amber-500",
                        "bg-pink-500",
                      ];

                      return (
                        <div key={department.name}>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                              {department.name}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              {department.count}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${colors[index % colors.length]}`}
                              style={{
                                width: `${(department.count / maxDepartmentCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Shift allocation and upcoming rotations */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

              {/* Shift allocation */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Shift Allocation
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Assignment distribution by shift
                    </p>
                  </div>
                  <Clock3 size={19} className="text-violet-500" />
                </div>

                <div className="mt-5 space-y-4">
                  {shiftStats.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">
                      No shifts available.
                    </p>
                  ) : (
                    shiftStats.map((shift) => (
                      <div key={shift.id}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: shift.color || "#6366f1",
                              }}
                            />
                            <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                              {shift.name}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {shift.count} assignments
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                totalShiftAssignments
                                  ? (shift.count / totalShiftAssignments) * 100
                                  : 0
                              }%`,
                              backgroundColor: shift.color || "#6366f1",
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming rotations */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Upcoming Rotations
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Next scheduled shift changes
                    </p>
                  </div>
                  <Repeat size={19} className="text-blue-500" />
                </div>

                <div className="mt-4 space-y-3">
                  {upcomingRotations.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">
                      No upcoming rotations scheduled.
                    </p>
                  ) : (
                    upcomingRotations.slice(0, 4).map((rotation) => (
                      <div
                        key={rotation.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                            {rotation.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {rotation.department} · {rotation.pattern} rotation
                          </p>
                        </div>

                        <div className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-center dark:bg-blue-500/10">
                          <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                            NEXT
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                            {formatDate(rotation.nextDate!)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Activity and notifications */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">

              {/* Recent activity */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Recent Activity
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Latest workspace activities
                    </p>
                  </div>
                  <Activity size={19} className="text-blue-500" />
                </div>

                {filteredActivities.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-400">
                    {search
                      ? "No activities match your search."
                      : "No recent activity available."}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 px-5 py-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          <Activity size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {activity.action}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {activity.description}
                          </p>
                          <p className="mt-2 text-[11px] text-slate-400">
                            {activity.user} · {activity.module}
                          </p>
                        </div>

                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Notifications
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Latest updates
                    </p>
                  </div>
                  <Bell size={19} className="text-violet-500" />
                </div>

                <div className="mt-4 space-y-3">
                  {recentNotifications.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">
                      No notifications available.
                    </p>
                  ) : (
                    recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>

                        <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-[10px] text-slate-400">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
