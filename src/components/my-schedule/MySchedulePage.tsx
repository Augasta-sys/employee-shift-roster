
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  BriefcaseBusiness,
  RefreshCw,
  CalendarClock,
  AlertCircle,
  X,
} from "lucide-react";

import DashboardLayout from "../dashboard/DashboardLayout";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Assignment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  shiftId: string;
  shiftName: string;
  date: string;
  status: "pending" | "confirmed" | "cancelled";
  assignedBy: string;
  createdAt: string;
}

interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  color: string;
  status: "active" | "inactive";
}

interface RotationRule {
  id: string;
  name: string;
  department: string;
  pattern: "weekly" | "monthly";
  shiftSequence: string[];
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
}

type CalendarView = "day" | "week" | "month";

const pad = (value: number) => String(value).padStart(2, "0");

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const startOfWeek = (date: Date) => {
  const result = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  result.setDate(result.getDate() - result.getDay());
  return result;
};

const MySchedulePage = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rotationRules, setRotationRules] = useState<RotationRule[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [search, setSearch] = useState("");

  const employeeId = user?.employeeId;

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [assignmentRes, shiftRes, rotationRes] = await Promise.all([
        api.get<Assignment[]>("/assignments"),
        api.get<Shift[]>("/shifts"),
        api.get<RotationRule[]>("/rotationRules"),
      ]);

      setAssignments(assignmentRes.data);
      setShifts(shiftRes.data);
      setRotationRules(rotationRes.data);
    } catch {
      setError(
        "Unable to load your schedule. Please check whether JSON Server is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const myAssignments = useMemo(() => {
    return assignments
      .filter(
        (assignment) =>
          assignment.employeeId === employeeId &&
          assignment.status !== "cancelled",
      )
      .filter((assignment) => {
        const searchText = search.toLowerCase();

        return (
          assignment.shiftName.toLowerCase().includes(searchText) ||
          assignment.department.toLowerCase().includes(searchText) ||
          assignment.date.includes(searchText)
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [assignments, employeeId, search]);

  const getShift = (shiftId: string) =>
    shifts.find((shift) => shift.id === shiftId);

  const todayKey = toDateKey(new Date());

  const todayAssignments = myAssignments.filter(
    (assignment) => assignment.date === todayKey,
  );

  const upcomingAssignments = myAssignments.filter(
    (assignment) => assignment.date > todayKey,
  );

  const confirmedCount = myAssignments.filter(
    (assignment) => assignment.status === "confirmed",
  ).length;

  const pendingCount = myAssignments.filter(
    (assignment) => assignment.status === "pending",
  ).length;

  const myDepartment = useMemo(() => {
    return assignments.find(
      (assignment) => assignment.employeeId === employeeId,
    )?.department;
  }, [assignments, employeeId]);

  const myRotationRules = useMemo(() => {
    return rotationRules.filter(
      (rule) =>
        rule.status === "active" &&
        rule.department === myDepartment,
    );
  }, [rotationRules, myDepartment]);

  const formatTime = (time: string) => {
    if (!time) return "--";

    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getHeaderLabel = () => {
    if (view === "day") {
      return currentDate.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (view === "month") {
      return currentDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
    }

    const first = startOfWeek(currentDate);
    const last = addDays(first, 6);

    return `${formatDate(first)} – ${formatDate(last)}`;
  };

  const changeDate = (direction: number) => {
    setCurrentDate((previous) => {
      const next = new Date(previous);

      if (view === "day") {
        next.setDate(next.getDate() + direction);
      } else if (view === "week") {
        next.setDate(next.getDate() + direction * 7);
      } else {
        next.setMonth(next.getMonth() + direction);
      }

      return next;
    });
  };

  const getAssignmentsForDate = (date: Date) =>
    myAssignments.filter(
      (assignment) => assignment.date === toDateKey(date),
    );

  const renderAssignment = (assignment: Assignment) => {
    const shift = getShift(assignment.shiftId);

    return (
      <button
        key={assignment.id}
        onClick={() => setSelectedAssignment(assignment)}
        title={`${assignment.shiftName} - ${assignment.employeeName}`}
        className="mb-2 w-full min-w-0 rounded-lg border-l-4 p-2 text-left transition hover:shadow-md sm:rounded-xl sm:p-3"
        style={{
          borderLeftColor: shift?.color || "#64748b",
          backgroundColor: shift?.color
            ? `${shift.color}18`
            : "rgba(100,116,139,0.08)",
        }}
      >
        <p className="truncate text-[10px] font-semibold text-slate-800 dark:text-white sm:text-sm">
          {assignment.shiftName}
        </p>

        <p className="mt-1 truncate text-[9px] text-slate-600 dark:text-slate-300 sm:text-xs">
          {shift
            ? `${formatTime(shift.startTime)} – ${formatTime(shift.endTime)}`
            : "Timing unavailable"}
        </p>

        <span
          className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-semibold sm:text-[10px] ${
            assignment.status === "confirmed"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          }`}
        >
          {assignment.status}
        </span>
      </button>
    );
  };

  const renderDayView = () => {
    const dayAssignments = getAssignmentsForDate(currentDate);

    return (
      <div className="space-y-3 p-3 sm:p-4">
        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {formatDate(currentDate)}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {dayAssignments.length} shift(s) scheduled
          </p>
        </div>

        {dayAssignments.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No shifts scheduled for this day.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {dayAssignments.map(renderAssignment)}
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const firstDay = startOfWeek(currentDate);

    const weekDays = Array.from({ length: 7 }, (_, index) =>
      addDays(firstDay, index),
    );

    return (
      <div className="grid w-full min-w-0 grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
        {weekDays.map((day) => {
          const dayAssignments = getAssignmentsForDate(day);
          const isToday = toDateKey(day) === todayKey;

          return (
            <div
              key={toDateKey(day)}
              className="min-h-[260px] min-w-0 sm:min-h-[330px]"
            >
              <div
                className={`border-b border-slate-200 px-0.5 py-2 text-center dark:border-slate-800 sm:px-2 sm:py-3 ${
                  isToday ? "bg-violet-50 dark:bg-violet-500/10" : ""
                }`}
              >
                <p className="truncate text-[9px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
                  {day.toLocaleDateString("en-IN", {
                    weekday: "short",
                  })}
                </p>

                <p
                  className={`mx-auto mt-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold sm:h-8 sm:w-8 sm:text-sm ${
                    isToday
                      ? "bg-violet-600 text-white"
                      : "text-slate-800 dark:text-white"
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>

              <div className="min-w-0 p-0.5 sm:p-2">
                {dayAssignments.length === 0 ? (
                  <p className="py-4 text-center text-[8px] text-slate-400 sm:text-[11px]">
                    -
                  </p>
                ) : (
                  dayAssignments.map(renderAssignment)
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const firstOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    const calendarStart = startOfWeek(firstOfMonth);

    const calendarDays = Array.from({ length: 42 }, (_, index) =>
      addDays(calendarStart, index),
    );

    return (
      <div className="w-full min-w-0">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day) => (
              <div
                key={day}
                className="px-0.5 py-2 text-center text-[9px] font-semibold text-slate-500 dark:text-slate-400 sm:px-2 sm:py-3 sm:text-xs"
              >
                {day}
              </div>
            ),
          )}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayAssignments = getAssignmentsForDate(day);
            const isCurrentMonth =
              day.getMonth() === currentDate.getMonth();
            const isToday = toDateKey(day) === todayKey;

            return (
              <button
                key={toDateKey(day)}
                onClick={() => {
                  setCurrentDate(day);
                  setView("day");
                }}
                className={`min-h-[76px] min-w-0 border-b border-r border-slate-100 p-1 text-left transition dark:border-slate-800 sm:min-h-32 sm:p-2 ${
                  !isCurrentMonth
                    ? "bg-slate-50/70 dark:bg-slate-950/40"
                    : "hover:bg-violet-50/70 dark:hover:bg-violet-500/10"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold sm:h-7 sm:w-7 sm:text-xs ${
                    isToday
                      ? "bg-violet-600 text-white"
                      : isCurrentMonth
                        ? "text-slate-800 dark:text-white"
                        : "text-slate-400 dark:text-slate-600"
                  }`}
                >
                  {day.getDate()}
                </span>

                <div className="mt-1 space-y-1">
                  {dayAssignments.slice(0, 2).map((assignment) => {
                    const shift = getShift(assignment.shiftId);

                    return (
                      <div
                        key={assignment.id}
                        title={assignment.shiftName}
                        className="truncate rounded px-1 py-1 text-[8px] font-medium text-slate-700 dark:text-slate-200 sm:text-[10px]"
                        style={{
                          backgroundColor: shift?.color
                            ? `${shift.color}25`
                            : "rgba(100,116,139,0.12)",
                          borderLeft: `2px solid ${shift?.color || "#64748b"}`,
                        }}
                      >
                        {assignment.shiftName}
                      </div>
                    );
                  })}

                  {dayAssignments.length > 2 && (
                    <p className="truncate text-[8px] font-semibold text-violet-600 dark:text-violet-400 sm:text-[10px]">
                      +{dayAssignments.length - 2} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const navigationButtonClass =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-violet-300";

  const todayButtonClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

  return (
    <DashboardLayout onSearch={setSearch}>
      <div className="min-h-full min-w-0 space-y-6 overflow-x-hidden p-1 sm:p-2">

        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <CalendarDays size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                My Schedule
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                View your personal shifts and upcoming rotations.
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              className="ml-auto"
              onClick={() => setError("")}
              aria-label="Close error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Today's Shifts",
              value: todayAssignments.length,
              icon: CalendarDays,
            },
            {
              label: "Total Assignments",
              value: myAssignments.length,
              icon: BriefcaseBusiness,
            },
            {
              label: "Confirmed",
              value: confirmedCount,
              icon: CalendarClock,
            },
            {
              label: "Pending",
              value: pendingCount,
              icon: Clock3,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      {item.value}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar and Side Information */}
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">

          {/* Calendar */}
          <div className="min-w-0 space-y-5 xl:col-span-2">
            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">

              {/* Calendar Controls */}
              <div className="flex min-w-0 flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <button
                    onClick={() => changeDate(-1)}
                    aria-label="Previous period"
                    className={navigationButtonClass}
                  >
                    <ChevronLeft size={19} />
                  </button>

                  <button
                    onClick={() => changeDate(1)}
                    aria-label="Next period"
                    className={navigationButtonClass}
                  >
                    <ChevronRight size={19} />
                  </button>

                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className={todayButtonClass}
                  >
                    Today
                  </button>

                  <h2 className="min-w-0 text-sm font-bold text-slate-900 dark:text-white sm:ml-2">
                    {getHeaderLabel()}
                  </h2>
                </div>

                <div className="flex w-full rounded-xl bg-slate-100 p-1 dark:bg-slate-800 xl:w-auto">
                  {(["day", "week", "month"] as CalendarView[]).map(
                    (item) => (
                      <button
                        key={item}
                        onClick={() => setView(item)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize transition sm:px-4 xl:flex-none ${
                          view === item
                            ? "bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-violet-300"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Calendar Content - No Horizontal Scrollbar */}
              <div className="mt-5 w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                {loading ? (
                  <div className="flex min-h-72 items-center justify-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                  </div>
                ) : myAssignments.length === 0 ? (
                  <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
                    <CalendarDays size={36} className="text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                      No shifts assigned yet
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Your assigned shifts will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    {view === "day" && renderDayView()}
                    {view === "week" && renderWeekView()}
                    {view === "month" && renderMonthView()}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side Panels */}
          <div className="min-w-0 space-y-5">

            {/* Today's Shift */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold text-slate-900 dark:text-white">
                Today's Shift
              </h2>

              {todayAssignments.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  You have no shift assigned today.
                </p>
              ) : (
                todayAssignments.map((assignment) => {
                  const shift = getShift(assignment.shiftId);

                  return (
                    <div
                      key={assignment.id}
                      className="mt-4 rounded-xl bg-violet-50 p-4 dark:bg-violet-500/10"
                    >
                      <p className="font-semibold text-violet-800 dark:text-violet-300">
                        {assignment.shiftName}
                      </p>

                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {shift
                          ? `${formatTime(shift.startTime)} – ${formatTime(shift.endTime)}`
                          : "Timing unavailable"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {assignment.department}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Upcoming Shifts */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-bold text-slate-900 dark:text-white">
                Upcoming Shifts
              </h2>

              <div className="mt-4 space-y-3">
                {upcomingAssignments.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No upcoming shifts.
                  </p>
                ) : (
                  upcomingAssignments.slice(0, 5).map((assignment) => (
                    <button
                      key={assignment.id}
                      onClick={() => setSelectedAssignment(assignment)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                          {assignment.shiftName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {assignment.date}
                        </p>
                      </div>

                      <ChevronRight
                        size={17}
                        className="shrink-0 text-slate-400 dark:text-slate-300"
                      />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* My Rotation */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <RefreshCw size={18} className="text-violet-500" />
                <h2 className="font-bold text-slate-900 dark:text-white">
                  My Rotation
                </h2>
              </div>

              {myRotationRules.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  No active rotation rule found for your department.
                </p>
              ) : (
                myRotationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800"
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      {rule.name}
                    </p>

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {rule.pattern === "weekly" ? "Weekly" : "Monthly"} rotation
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {rule.startDate} to {rule.endDate}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {rule.shiftSequence.map((shiftId) => {
                        const shift = getShift(shiftId);

                        return (
                          <span
                            key={shiftId}
                            className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                          >
                            {shift?.name || shiftId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Shift Details Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Shift Details
                </h2>

                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Close details"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Shift
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {selectedAssignment.shiftName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Date
                  </p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">
                    {selectedAssignment.date}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Department
                  </p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">
                    {selectedAssignment.department}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Shift Timing
                  </p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">
                    {getShift(selectedAssignment.shiftId)
                      ? `${formatTime(getShift(selectedAssignment.shiftId)!.startTime)} – ${formatTime(getShift(selectedAssignment.shiftId)!.endTime)}`
                      : "Timing unavailable"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assigned By
                  </p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-white">
                    {selectedAssignment.assignedBy}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Status
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedAssignment.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                    }`}
                  >
                    {selectedAssignment.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAssignment(null)}
                className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MySchedulePage;
