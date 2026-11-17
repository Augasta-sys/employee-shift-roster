
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Users,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
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
  status: string;
}

interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  color: string;
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
  status: "pending" | "confirmed" | "cancelled";
  assignedBy: string;
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

type ModalMode = "add" | "edit" | "view" | null;

const emptyForm = {
  employeeId: "",
  shiftId: "",
  date: new Date().toISOString().split("T")[0],
  status: "pending" as Assignment["status"],
};

export default function AssignmentsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [assignmentResponse, employeeResponse, shiftResponse] =
        await Promise.all([
          api.get<Assignment[]>("/assignments"),
          api.get<Employee[]>("/employees"),
          api.get<Shift[]>("/shifts"),
        ]);

      setAssignments(assignmentResponse.data);
      setEmployees(employeeResponse.data);
      setShifts(shiftResponse.data);
    } catch {
      setError("Unable to load assignment data. Please check JSON Server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Resolve the manager's department through their linked employee record.
  const userEmployee = employees.find(
    (employee) => employee.id === user?.employeeId
  );
  const userDepartment = userEmployee?.department;

  // Admins can manage all employees; managers are limited to their department.
  // Employees only need their own employee record for this page.
  const visibleEmployees = useMemo(() => {
    if (user?.role === "admin") return employees;

    if (user?.role === "manager") {
      return employees.filter(
        (employee) => employee.department === userDepartment
      );
    }

    return employees.filter(
      (employee) => employee.id === user?.employeeId
    );
  }, [employees, user, userDepartment]);

  const visibleAssignments = useMemo(() => {
    if (user?.role === "admin") return assignments;

    if (user?.role === "manager") {
      return assignments.filter(
        (assignment) => assignment.department === userDepartment
      );
    }

    return assignments.filter(
      (assignment) => assignment.employeeId === user?.employeeId
    );
  }, [assignments, user, userDepartment]);

  const departments = useMemo(
    () => [...new Set(visibleEmployees.map((employee) => employee.department))],
    [visibleEmployees]
  );

  const filteredAssignments = useMemo(() => {
    return visibleAssignments.filter((assignment) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        assignment.employeeName.toLowerCase().includes(searchValue) ||
        assignment.employeeId.toLowerCase().includes(searchValue) ||
        assignment.shiftName.toLowerCase().includes(searchValue) ||
        assignment.id.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || assignment.status === statusFilter;

      const matchesDepartment =
        departmentFilter === "all" ||
        assignment.department === departmentFilter;

      const matchesDate =
        !dateFilter || assignment.date === dateFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesDate
      );
    });
  }, [
    visibleAssignments,
    search,
    statusFilter,
    departmentFilter,
    dateFilter,
  ]);

  const pendingCount = visibleAssignments.filter(
    (item) => item.status === "pending"
  ).length;

  const confirmedCount = visibleAssignments.filter(
    (item) => item.status === "confirmed"
  ).length;

  const cancelledCount = visibleAssignments.filter(
    (item) => item.status === "cancelled"
  ).length;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

  const selectedEmployee = visibleEmployees.find(
    (employee) => employee.id === form.employeeId
  );

  const selectedShift = shifts.find(
    (shift) => shift.id === form.shiftId
  );

  const openAddModal = () => {
    setSelectedAssignment(null);
    setForm({
      ...emptyForm,
      employeeId:
        visibleEmployees.find((item) => item.status === "active")?.id || "",
      shiftId: shifts.find((item) => item.status === "active")?.id || "",
    });
    setFormError("");
    setModalMode("add");
  };

  const openEditModal = (assignment: Assignment) => {
    if (!canManage || !visibleAssignments.some((item) => item.id === assignment.id)) {
      return;
    }
    setSelectedAssignment(assignment);
    setForm({
      employeeId: assignment.employeeId,
      shiftId: assignment.shiftId,
      date: assignment.date,
      status: assignment.status,
    });
    setFormError("");
    setModalMode("edit");
  };

  const openViewModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedAssignment(null);
    setFormError("");
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const generateAssignmentId = () => {
    const highestId = assignments.reduce((highest, assignment) => {
      const number = Number(assignment.id.replace(/\D/g, ""));
      return Math.max(highest, number);
    }, 0);

    return `AS${String(highestId + 1).padStart(3, "0")}`;
  };

  // Convert a shift into an absolute time interval.
  // Overnight shifts are supported.
  const getShiftInterval = (date: string, shift: Shift) => {
    const [year, month, day] = date.split("-").map(Number);
    const [startHour, startMinute] = shift.startTime.split(":").map(Number);
    const [endHour, endMinute] = shift.endTime.split(":").map(Number);

    const start = new Date(
      year,
      month - 1,
      day,
      startHour,
      startMinute
    ).getTime();

    let end = new Date(
      year,
      month - 1,
      day,
      endHour,
      endMinute
    ).getTime();

    if (end <= start) {
      end += 24 * 60 * 60 * 1000;
    }

    return { start, end };
  };

  const hasOverlappingAssignment = (
    employeeId: string,
    shift: Shift,
    date: string
  ) => {
    const newInterval = getShiftInterval(date, shift);

    return assignments.some((assignment) => {
      if (assignment.employeeId !== employeeId) return false;

      if (
        assignment.status === "cancelled" ||
        assignment.id === selectedAssignment?.id
      ) {
        return false;
      }

      const existingShift = shifts.find(
        (item) => item.id === assignment.shiftId
      );

      if (!existingShift) return false;

      const existingInterval = getShiftInterval(
        assignment.date,
        existingShift
      );

      return (
        newInterval.start < existingInterval.end &&
        newInterval.end > existingInterval.start
      );
    });
  };

  const writeActivityLog = async (
    action: string,
    description: string
  ) => {
    const log: ActivityLog = {
      id: `LOG${Date.now()}`,
      user: user?.name || "System",
      action,
      module: "Assignments",
      description,
      timestamp: new Date().toISOString(),
    };

    await api.post("/activityLogs", log);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    if (!form.employeeId || !form.shiftId || !form.date) {
      setFormError("Please select an employee, shift and date.");
      return;
    }

    const employee = visibleEmployees.find(
      (item) => item.id === form.employeeId
    );

    const shift = shifts.find((item) => item.id === form.shiftId);

    if (!employee || !shift) {
      setFormError("Selected employee or shift could not be found.");
      return;
    }

    if (employee.status !== "active") {
      setFormError("Inactive employees cannot be assigned to shifts.");
      return;
    }

    if (shift.status !== "active") {
      setFormError("Inactive shifts cannot be assigned.");
      return;
    }

    const selectedDate = new Date(`${form.date}T00:00:00`);
    const validDate =
      !Number.isNaN(selectedDate.getTime()) &&
      selectedDate.toISOString().slice(0, 10) === form.date;

    if (!validDate) {
      setFormError("Please select a valid assignment date.");
      return;
    }

    const duplicate = assignments.some(
      (assignment) =>
        assignment.employeeId === form.employeeId &&
        assignment.date === form.date &&
        assignment.id !== selectedAssignment?.id &&
        assignment.status !== "cancelled"
    );

    if (duplicate) {
      setFormError(
        "This employee already has an assignment on the selected date."
      );
      return;
    }

    if (
      hasOverlappingAssignment(
        form.employeeId,
        shift,
        form.date
      )
    ) {
      setFormError(
        "This shift overlaps with another assignment for the selected employee."
      );
      return;
    }

    try {
      setSaving(true);

      if (modalMode === "add") {
        const newAssignment: Assignment = {
          id: generateAssignmentId(),
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          shiftId: shift.id,
          shiftName: shift.name,
          date: form.date,
          status: form.status,
          assignedBy: user?.name || "Admin User",
          createdAt: new Date().toISOString(),
        };

        const response = await api.post<Assignment>(
          "/assignments",
          newAssignment
        );

        setAssignments((previous) => [...previous, response.data]);

        try {
          await writeActivityLog(
            "Created shift assignment",
            `Assigned ${employee.name} to ${shift.name} on ${form.date}.`
          );
        } catch {
          console.error("Assignment saved, but activity log failed.");
        }

        setSuccess("Shift assignment created successfully.");
      }

      if (modalMode === "edit" && selectedAssignment) {
        const updatedAssignment: Assignment = {
          ...selectedAssignment,
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          shiftId: shift.id,
          shiftName: shift.name,
          date: form.date,
          status: form.status,
        };

        const response = await api.put<Assignment>(
          `/assignments/${selectedAssignment.id}`,
          updatedAssignment
        );

        setAssignments((previous) =>
          previous.map((item) =>
            item.id === selectedAssignment.id ? response.data : item
          )
        );

        try {
          await writeActivityLog(
            "Updated shift assignment",
            `Updated ${employee.name}'s assignment to ${shift.name} on ${form.date}.`
          );
        } catch {
          console.error("Assignment updated, but activity log failed.");
        }

        setSuccess("Shift assignment updated successfully.");
      }

      closeModal();
    } catch {
      setFormError("Unable to save assignment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateAssignmentStatus = async (
    assignment: Assignment,
    status: Assignment["status"]
  ) => {
    if (
      !canManage ||
      !visibleAssignments.some((item) => item.id === assignment.id)
    ) {
      return;
    }

    try {
      await api.patch(`/assignments/${assignment.id}`, { status });

      setAssignments((previous) =>
        previous.map((item) =>
          item.id === assignment.id ? { ...item, status } : item
        )
      );

      try {
        await writeActivityLog(
          `Changed assignment status to ${status}`,
          `${assignment.employeeName}'s ${assignment.shiftName} assignment on ${assignment.date} is now ${status}.`
        );
      } catch {
        console.error("Status updated, but activity log failed.");
      }

      setSuccess(`Assignment status changed to ${status}.`);
    } catch {
      setError("Unable to update assignment status.");
    }
  };

  const deleteAssignment = async (assignment: Assignment) => {
    if (
      !canManage ||
      !visibleAssignments.some((item) => item.id === assignment.id)
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${assignment.employeeName}'s assignment on ${assignment.date}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/assignments/${assignment.id}`);

      setAssignments((previous) =>
        previous.filter((item) => item.id !== assignment.id)
      );

      try {
        await writeActivityLog(
          "Deleted shift assignment",
          `Deleted ${assignment.employeeName}'s ${assignment.shiftName} assignment on ${assignment.date}.`
        );
      } catch {
        console.error("Assignment deleted, but activity log failed.");
      }

      setSuccess("Assignment deleted successfully.");
    } catch {
      setError("Unable to delete assignment.");
    }
  };

  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <DashboardLayout onSearch={setSearch}>
      <div className="space-y-6 p-1">
        {/* Heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Shift Assignments
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Assign employees to shifts and manage daily duty schedules.
            </p>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90"
            >
              <Plus size={18} />
              Create Assignment
            </button>
          )}
        </div>

        {success && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} />
              {success}
            </span>
            <button onClick={() => setSuccess("")} aria-label="Dismiss">
              <X size={17} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Assignments"
            value={visibleAssignments.length}
            icon={<CalendarDays size={21} />}
            color="blue"
          />
          <StatCard
            title="Confirmed"
            value={confirmedCount}
            icon={<CheckCircle2 size={21} />}
            color="green"
          />
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={<Clock3 size={21} />}
            color="orange"
          />
          <StatCard
            title="Cancelled"
            value={cancelledCount}
            icon={<Users size={21} />}
            color="violet"
          />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee or shift..."
                className={`${inputClass} pl-11`}
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className={inputClass}
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className={`${inputClass} min-w-0`}
                aria-label="Filter by date"
              />

              <button
                onClick={() => {
                  setSearch("");
                  setDepartmentFilter("all");
                  setStatusFilter("all");
                  setDateFilter("");
                }}
                className="flex shrink-0 items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Reset filters"
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Assignment table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {user?.role === "employee"
                ? "My Assignments"
                : user?.role === "manager"
                  ? "Department Assignments"
                  : "All Assignments"}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredAssignments.length} assignments
              {user?.role === "employee"
                ? " for your account"
                : user?.role === "manager"
                  ? ` in ${userDepartment || "your department"}`
                  : ""}
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <AlertCircle size={30} className="mx-auto text-red-500" />
              <p className="mt-3 text-sm text-red-500">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays
                size={36}
                className="mx-auto text-slate-300 dark:text-slate-600"
              />
              <p className="mt-3 font-semibold text-slate-700 dark:text-white">
                No assignments found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters or create a new assignment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Employee</th>
                    <th className="px-5 py-4 font-semibold">Department</th>
                    <th className="px-5 py-4 font-semibold">Shift</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Assigned By</th>
                    <th className="px-5 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAssignments.map((assignment) => {
                    const shift = shifts.find(
                      (item) => item.id === assignment.shiftId
                    );

                    return (
                      <tr
                        key={assignment.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                              {assignment.employeeName
                                .split(" ")
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                {assignment.employeeName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {assignment.employeeId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {assignment.department}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: shift?.color || "#64748b",
                              }}
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                {assignment.shiftName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {shift
                                  ? `${shift.startTime} – ${shift.endTime}`
                                  : assignment.shiftId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {formatDate(assignment.date)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={assignment.status} />
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {assignment.assignedBy}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <ActionButton
                              title="View"
                              onClick={() => openViewModal(assignment)}
                            >
                              <Eye size={17} />
                            </ActionButton>

                            {canManage && (
                              <>
                                <ActionButton
                                  title="Edit"
                                  onClick={() => openEditModal(assignment)}
                                >
                                  <Pencil size={17} />
                                </ActionButton>

                                {assignment.status !== "confirmed" && (
                                  <ActionButton
                                    title="Confirm"
                                    onClick={() =>
                                      updateAssignmentStatus(
                                        assignment,
                                        "confirmed"
                                      )
                                    }
                                  >
                                    <CheckCircle2 size={17} />
                                  </ActionButton>
                                )}

                                {assignment.status !== "cancelled" && (
                                  <ActionButton
                                    title="Cancel assignment"
                                    danger
                                    onClick={() =>
                                      updateAssignmentStatus(
                                        assignment,
                                        "cancelled"
                                      )
                                    }
                                  >
                                    <X size={17} />
                                  </ActionButton>
                                )}

                                <ActionButton
                                  title="Delete"
                                  danger
                                  onClick={() => deleteAssignment(assignment)}
                                >
                                  <Trash2 size={17} />
                                </ActionButton>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit / View modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="assignment-modal-scroll my-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === "add"
                    ? "Create Shift Assignment"
                    : modalMode === "edit"
                      ? "Edit Shift Assignment"
                      : "Assignment Details"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {modalMode === "view"
                    ? "View assignment information"
                    : "Select an employee, shift and date"}
                </p>
              </div>

              <button
                onClick={closeModal}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {modalMode === "view" && selectedAssignment ? (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold text-slate-500">
                    ASSIGNMENT ID
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {selectedAssignment.id}
                  </h3>
                  <div className="mt-3">
                    <StatusBadge status={selectedAssignment.status} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Employee"
                    value={selectedAssignment.employeeName}
                  />
                  <DetailItem
                    label="Employee ID"
                    value={selectedAssignment.employeeId}
                  />
                  <DetailItem
                    label="Department"
                    value={selectedAssignment.department}
                  />
                  <DetailItem
                    label="Shift"
                    value={selectedAssignment.shiftName}
                  />
                  <DetailItem
                    label="Assignment Date"
                    value={formatDate(selectedAssignment.date)}
                  />
                  <DetailItem
                    label="Assigned By"
                    value={selectedAssignment.assignedBy}
                  />
                  <DetailItem
                    label="Created At"
                    value={new Date(
                      selectedAssignment.createdAt
                    ).toLocaleString("en-IN")}
                  />
                </div>

                <button
                  onClick={closeModal}
                  className="w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                {formError && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    {formError}
                  </div>
                )}

                <FormField label="Select Employee">
                  <select
                    name="employeeId"
                    value={form.employeeId}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Choose employee</option>
                    {visibleEmployees
                      .filter(
                        (employee) =>
                          employee.status === "active" ||
                          employee.id === selectedAssignment?.employeeId
                      )
                      .map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.id})
                        </option>
                      ))}
                  </select>
                </FormField>

                {selectedEmployee && (
                  <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-500/10">
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Selected Department
                    </p>
                    <p className="mt-1 text-sm font-semibold text-blue-800 dark:text-blue-200">
                      {selectedEmployee.department}
                    </p>
                  </div>
                )}

                <FormField label="Select Shift">
                  <select
                    name="shiftId"
                    value={form.shiftId}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">Choose shift</option>
                    {shifts
                      .filter(
                        (shift) =>
                          shift.status === "active" ||
                          shift.id === selectedAssignment?.shiftId
                      )
                      .map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.startTime} – {shift.endTime})
                        </option>
                      ))}
                  </select>
                </FormField>

                {selectedShift && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <span
                      className="h-10 w-2 rounded-full"
                      style={{ backgroundColor: selectedShift.color }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {selectedShift.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedShift.startTime} – {selectedShift.endTime}
                        {" · "}
                        {selectedShift.breakDuration} min break
                      </p>
                    </div>
                  </div>
                )}

                <FormField label="Assignment Date">
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </FormField>

                <FormField label="Assignment Status">
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </FormField>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : modalMode === "add"
                        ? "Create Assignment"
                        : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "violet";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    violet:
      "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className={`rounded-xl p-3 ${styles[color]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    confirmed:
      "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    cancelled:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  };

  const className =
    styles[status as keyof typeof styles] ||
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${className}`}>
      {status}
    </span>
  );
}

function ActionButton({
  children,
  title,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          : "text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
      }`}
    >
      {children}
    </button>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-white">
        {value || "—"}
      </p>
    </div>
  );
}
