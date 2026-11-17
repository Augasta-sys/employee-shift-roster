import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";
import DashboardLayout from "../dashboard/DashboardLayout";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: "active" | "inactive";
}

interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  color: string;
  status: "active" | "inactive";
}

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

type CalendarView = "day" | "week" | "month";

const pad = (value: number) => String(value).padStart(2, "0");

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const startOfWeek = (date: Date) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  return result;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const RosterPage = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const isEmployee = user?.role === "employee";

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [assignmentRes, employeeRes, shiftRes] = await Promise.all([
        api.get<Assignment[]>("/assignments"),
        api.get<Employee[]>("/employees"),
        api.get<Shift[]>("/shifts"),
      ]);

      setAssignments(assignmentRes.data);
      setEmployees(employeeRes.data);
      setShifts(shiftRes.data);
    } catch {
      setError("Unable to load roster data. Please check the JSON Server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getShift = (shiftId: string) =>
    shifts.find((shift) => shift.id === shiftId);

  const departments = useMemo(
    () => [...new Set(employees.map((employee) => employee.department))].sort(),
    [employees],
  );

  const visibleAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const ownAssignment =
        !isEmployee || assignment.employeeId === user?.employeeId;

      const departmentMatch =
        departmentFilter === "all" ||
        assignment.department === departmentFilter;

      const employeeMatch =
        employeeFilter === "all" ||
        assignment.employeeId === employeeFilter;

      const statusMatch =
        statusFilter === "all" || assignment.status === statusFilter;

      const searchMatch =
        assignment.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        assignment.shiftName.toLowerCase().includes(search.toLowerCase()) ||
        assignment.department.toLowerCase().includes(search.toLowerCase()) ||
        assignment.employeeId.toLowerCase().includes(search.toLowerCase());

      return (
        ownAssignment &&
        departmentMatch &&
        employeeMatch &&
        statusMatch &&
        searchMatch
      );
    });
  }, [
    assignments,
    isEmployee,
    user?.employeeId,
    departmentFilter,
    employeeFilter,
    statusFilter,
    search,
  ]);

  const getAssignmentsForDate = (date: Date) => {
    const dateKey = toDateKey(date);

    return visibleAssignments.filter(
      (assignment) =>
        assignment.date === dateKey && assignment.status !== "cancelled",
    );
  };

  const todayAssignments = getAssignmentsForDate(new Date());

  const confirmedCount = visibleAssignments.filter(
    (assignment) => assignment.status === "confirmed",
  ).length;

  const pendingCount = visibleAssignments.filter(
    (assignment) => assignment.status === "pending",
  ).length;

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

  const goToToday = () => setCurrentDate(new Date());

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

    const firstDay = startOfWeek(currentDate);
    const lastDay = addDays(firstDay, 6);

    const firstLabel = firstDay.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    const lastLabel = lastDay.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return `${firstLabel} – ${lastLabel}`;
  };

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

  const formatShortDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

  const renderAssignment = (assignment: Assignment) => {
    const shift = getShift(assignment.shiftId);

    return (
      <button
        key={assignment.id}
        onClick={() => setSelectedAssignment(assignment)}
        className="mb-2 w-full rounded-lg border-l-4 p-2.5 text-left transition hover:shadow-md"
        style={{
          borderLeftColor: shift?.color || "#64748b",
          backgroundColor: shift?.color
            ? `${shift.color}18`
            : "rgba(100,116,139,0.08)",
        }}
      >
        <p className="truncate text-xs font-semibold text-slate-800 dark:text-white">
          {assignment.employeeName}
        </p>
        <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">
          {assignment.shiftName}
        </p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {shift
            ? `${formatTime(shift.startTime)} – ${formatTime(shift.endTime)}`
            : "Shift timing unavailable"}
        </p>
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {currentDate.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {dayAssignments.length} assignment(s)
            </p>
          </div>
          <CalendarDays className="text-violet-500" size={21} />
        </div>

        {dayAssignments.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            No assignments scheduled for this day.
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
      <div className="grid min-w-[760px] grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800">
        {weekDays.map((day) => {
          const dayAssignments = getAssignmentsForDate(day);
          const isToday = toDateKey(day) === toDateKey(new Date());

          return (
            <div key={toDateKey(day)} className="min-h-[350px]">
              <div
                className={`border-b border-slate-200 px-2 py-3 text-center dark:border-slate-800 ${
                  isToday ? "bg-violet-50 dark:bg-violet-500/10" : ""
                }`}
              >
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {day.toLocaleDateString("en-IN", { weekday: "short" })}
                </p>
                <p
                  className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isToday
                      ? "bg-violet-600 text-white"
                      : "text-slate-800 dark:text-white"
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>

              <div className="p-2">
                {dayAssignments.length === 0 ? (
                  <p className="py-5 text-center text-[11px] text-slate-400">
                    No shifts
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
      <div className="min-w-[700px]">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayAssignments = getAssignmentsForDate(day);
            const isCurrentMonth =
              day.getMonth() === currentDate.getMonth();
            const isToday = toDateKey(day) === toDateKey(new Date());

            return (
              <button
                key={toDateKey(day)}
                onClick={() => {
                  setCurrentDate(day);
                  setView("day");
                }}
                className={`min-h-28 border-b border-r border-slate-100 p-2 text-left transition hover:bg-violet-50/70 dark:border-slate-800 dark:hover:bg-violet-500/10 sm:min-h-32 ${
                  !isCurrentMonth ? "bg-slate-50/70 dark:bg-slate-950/40" : ""
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? "bg-violet-600 text-white"
                      : isCurrentMonth
                        ? "text-slate-800 dark:text-white"
                        : "text-slate-400"
                  }`}
                >
                  {day.getDate()}
                </span>

                <div className="mt-2 space-y-1">
                  {dayAssignments.slice(0, 2).map((assignment) => {
                    const shift = getShift(assignment.shiftId);

                    return (
                      <div
                        key={assignment.id}
                        className="truncate rounded px-1.5 py-1 text-[10px] font-medium text-slate-700 dark:text-slate-200"
                        style={{
                          backgroundColor: shift?.color
                            ? `${shift.color}25`
                            : "rgba(100,116,139,0.12)",
                          borderLeft: `2px solid ${shift?.color || "#64748b"}`,
                        }}
                      >
                        {assignment.employeeName}
                      </div>
                    );
                  })}

                  {dayAssignments.length > 2 && (
                    <p className="px-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
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

  return (
    <DashboardLayout onSearch={setSearch}>
      <div className="min-h-full space-y-6 p-1 sm:p-2">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <CalendarDays size={23} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Roster Calendar
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                View and monitor employee shift schedules.
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

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <span className="flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </span>
            <button onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Today's Assignments
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {todayAssignments.length}
                </h2>
              </div>
              <div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                <CalendarDays size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Confirmed Assignments
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {confirmedCount}
                </h2>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Users size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pending Assignments
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {pendingCount}
                </h2>
              </div>
              <div className="rounded-xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <Clock3 size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee or shift..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {!isEmployee && (
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          )}

          {!isEmployee && (
            <select
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Calendar Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => changeDate(-1)}
                aria-label="Previous period"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={19} />
              </button>
              <button
                onClick={() => changeDate(1)}
                aria-label="Next period"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronRight size={19} />
              </button>
              <button
                onClick={goToToday}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Today
              </button>
              <h2 className="ml-1 text-base font-bold text-slate-900 dark:text-white sm:ml-3">
                {getHeaderLabel()}
              </h2>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(["day", "week", "month"] as CalendarView[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition sm:flex-none ${
                    view === item
                      ? "bg-white text-violet-700 shadow-sm dark:bg-slate-700 dark:text-violet-300"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            {loading ? (
              <div className="flex min-h-72 items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
              </div>
            ) : visibleAssignments.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
                <CalendarDays size={36} className="text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                  No roster assignments found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try changing the filters or create a shift assignment.
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

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            {shifts
              .filter((shift) => shift.status === "active")
              .map((shift) => (
                <div key={shift.id} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: shift.color }}
                  />
                  {shift.name}
                </div>
              ))}
          </div>
        </div>

        {/* Assignment Details Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Assignment Details
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedAssignment.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Employee</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {selectedAssignment.employeeName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedAssignment.employeeId}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {selectedAssignment.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                      {formatShortDate(
                        new Date(`${selectedAssignment.date}T00:00:00`),
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Shift</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {selectedAssignment.shiftName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {getShift(selectedAssignment.shiftId)
                      ? `${formatTime(getShift(selectedAssignment.shiftId)!.startTime)} – ${formatTime(getShift(selectedAssignment.shiftId)!.endTime)}`
                      : "Shift timing unavailable"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Assigned By</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                    {selectedAssignment.assignedBy}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedAssignment.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : selectedAssignment.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {selectedAssignment.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAssignment(null)}
                className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
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

export default RosterPage;
