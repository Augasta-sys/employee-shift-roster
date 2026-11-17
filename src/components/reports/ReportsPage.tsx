import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Users,
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "../dashboard/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface Assignment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  shiftId: string;
  shiftName: string;
  date: string;
  status: string;
}

interface Department {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  name: string;
  code: string;
  status: string;
}

const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const formatInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

const ReportsPage = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [startDate, setStartDate] = useState(formatInputDate(firstDay));
  const [endDate, setEndDate] = useState(formatInputDate(today));
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [assignmentResponse, departmentResponse, shiftResponse] =
  await Promise.all([
    api.get<Assignment[]>("/assignments"),
    api.get<Department[]>("/departments"),
    api.get<Shift[]>("/shifts"),
  ]);

setAssignments(assignmentResponse.data);
setDepartments(departmentResponse.data);
setShifts(shiftResponse.data);
    } catch {
      setError("Unable to load report data. Please check whether JSON Server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const isEmployee = user?.role === "employee";

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesDate =
        assignment.date >= startDate && assignment.date <= endDate;

      const matchesDepartment =
        selectedDepartment === "all" ||
        assignment.department === selectedDepartment;

      const matchesUser =
        !isEmployee ||
        String(assignment.employeeId) === String(user?.employeeId);

      return matchesDate && matchesDepartment && matchesUser;
    });
  }, [
    assignments,
    startDate,
    endDate,
    selectedDepartment,
    isEmployee,
    user?.employeeId,
  ]);

  const totalAssignments = filteredAssignments.length;

  const confirmedCount = filteredAssignments.filter(
    (item) => item.status?.toLowerCase() === "confirmed"
  ).length;

  const pendingCount = filteredAssignments.filter(
    (item) => item.status?.toLowerCase() === "pending"
  ).length;

  const otherCount = filteredAssignments.filter(
    (item) =>
      !["confirmed", "pending"].includes(item.status?.toLowerCase())
  ).length;

  const uniqueEmployees = new Set(
    filteredAssignments.map((item) => item.employeeId)
  ).size;

  const departmentStats = departments.map((department) => ({
    name: department.name,
    count: filteredAssignments.filter(
      (item) => item.department === department.name
    ).length,
  }));

  const shiftStats = shifts.map((shift) => ({
    name: shift.name,
    count: filteredAssignments.filter(
      (item) => item.shiftId === shift.id
    ).length,
  }));

  const maxDepartmentCount = Math.max(
    ...departmentStats.map((item) => item.count),
    1
  );

  const maxShiftCount = Math.max(
    ...shiftStats.map((item) => item.count),
    1
  );

  const employeeStats = useMemo(() => {
    const employeeMap = new Map<string, {
      employeeId: string;
      name: string;
      department: string;
      total: number;
      confirmed: number;
      pending: number;
    }>();

    filteredAssignments.forEach((assignment) => {
      const existing = employeeMap.get(assignment.employeeId);

      if (existing) {
        existing.total += 1;

        if (assignment.status?.toLowerCase() === "confirmed") {
          existing.confirmed += 1;
        }

        if (assignment.status?.toLowerCase() === "pending") {
          existing.pending += 1;
        }
      } else {
        employeeMap.set(assignment.employeeId, {
          employeeId: assignment.employeeId,
          name: assignment.employeeName,
          department: assignment.department,
          total: 1,
          confirmed:
            assignment.status?.toLowerCase() === "confirmed" ? 1 : 0,
          pending:
            assignment.status?.toLowerCase() === "pending" ? 1 : 0,
        });
      }
    });

    return Array.from(employeeMap.values()).sort(
      (a, b) => b.total - a.total
    );
  }, [filteredAssignments]);

  const exportCSV = () => {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Shift",
      "Date",
      "Status",
    ];

    const rows = filteredAssignments.map((item) => [
      item.employeeId,
      item.employeeName,
      item.department,
      item.shiftName,
      item.date,
      item.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `shiftsync-report-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setStartDate(formatInputDate(firstDay));
    setEndDate(formatInputDate(today));
    setSelectedDepartment("all");
  };

  const statCards = [
    {
      title: "Total Assignments",
      value: totalAssignments,
      icon: CalendarDays,
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
    },
    {
      title: "Employees Scheduled",
      value: uniqueEmployees,
      icon: Users,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    },
    {
      title: "Confirmed",
      value: confirmedCount,
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    },
    {
      title: "Pending",
      value: pendingCount,
      icon: Clock3,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    },
  ];

  return (
    <DashboardLayout onSearch={() => {}}>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review shift assignments and workforce scheduling insights.
            </p>
          </div>

          <button
            onClick={exportCSV}
            disabled={loading || filteredAssignments.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} />
            Export CSV
          </button>
        </div>

        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
            <button
              onClick={loadReports}
              className="inline-flex items-center gap-2 font-semibold"
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        <section className={`${cardClass} space-y-4`}>
          <div className="flex items-center gap-2">
            <BarChart3 size={19} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Report Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {!isEmployee && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All Departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.name}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className={`${cardClass} flex min-h-64 items-center justify-center`}>
            <div className="text-center">
              <RefreshCw className="mx-auto mb-3 animate-spin text-indigo-600" size={28} />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading reports...
              </p>
            </div>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div key={stat.title} className={cardClass}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {stat.title}
                        </p>
                        <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                          {stat.value}
                        </h3>
                      </div>
                      <div className={`rounded-xl p-3 ${stat.color}`}>
                        <Icon size={22} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div className={cardClass}>
                <div className="mb-5">
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    Department-wise Assignments
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Assignments grouped by department
                  </p>
                </div>

                <div className="space-y-5">
                  {departmentStats.length === 0 ? (
                    <p className="text-sm text-slate-500">No departments found.</p>
                  ) : (
                    departmentStats.map((item) => (
                      <div key={item.name}>
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                          <span className="text-slate-600 dark:text-slate-300">
                            {item.name}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.count}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{
                              width: `${(item.count / maxDepartmentCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={cardClass}>
                <div className="mb-5">
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    Shift-wise Assignments
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Assignments grouped by shift
                  </p>
                </div>

                <div className="space-y-5">
                  {shiftStats.length === 0 ? (
                    <p className="text-sm text-slate-500">No shifts found.</p>
                  ) : (
                    shiftStats.map((item) => (
                      <div key={item.name}>
                        <div className="mb-2 flex justify-between gap-3 text-sm">
                          <span className="text-slate-600 dark:text-slate-300">
                            {item.name}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.count}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-violet-500 transition-all"
                            style={{
                              width: `${(item.count / maxShiftCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className={cardClass}>
                <h2 className="mb-5 font-semibold text-slate-900 dark:text-white">
                  Assignment Status
                </h2>

                <div className="space-y-4">
                  {[
                    {
                      label: "Confirmed",
                      count: confirmedCount,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Pending",
                      count: pendingCount,
                      color: "bg-amber-500",
                    },
                    {
                      label: "Other statuses",
                      count: otherCount,
                      color: "bg-slate-500",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">
                          {item.label}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{
                            width: `${
                              totalAssignments
                                ? (item.count / totalAssignments) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${cardClass} xl:col-span-2`}>
                <div className="mb-4 flex items-center gap-2">
                  <FileSpreadsheet size={19} className="text-indigo-600 dark:text-indigo-400" />
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    Employee Assignment Summary
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[550px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        <th className="px-3 py-3 font-semibold">Employee</th>
                        <th className="px-3 py-3 font-semibold">Department</th>
                        <th className="px-3 py-3 text-center font-semibold">Total</th>
                        <th className="px-3 py-3 text-center font-semibold">Confirmed</th>
                        <th className="px-3 py-3 text-center font-semibold">Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeStats.map((employee) => (
                        <tr
                          key={employee.employeeId}
                          className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                        >
                          <td className="px-3 py-3">
                            <p className="font-medium text-slate-800 dark:text-white">
                              {employee.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {employee.employeeId}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                            {employee.department}
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-white">
                            {employee.total}
                          </td>
                          <td className="px-3 py-3 text-center text-emerald-600 dark:text-emerald-400">
                            {employee.confirmed}
                          </td>
                          <td className="px-3 py-3 text-center text-amber-600 dark:text-amber-400">
                            {employee.pending}
                          </td>
                        </tr>
                      ))}

                      {employeeStats.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-10 text-center text-slate-500 dark:text-slate-400"
                          >
                            No assignment records found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Showing {filteredAssignments.length} assignment records
              </span>
              <span>
                Report period: {startDate} to {endDate}
              </span>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
