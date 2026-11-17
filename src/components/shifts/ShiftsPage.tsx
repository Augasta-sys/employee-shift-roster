
import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Plus,
  Search,
  Pencil,
  Eye,
  Trash2,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Timer,
  Palette,
} from "lucide-react";
import DashboardLayout from "../dashboard/DashboardLayout";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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

interface Assignment {
  id: string;
  shiftId: string;
}

interface RotationRule {
  id: string;
  shiftSequence: string[];
}

type ModalMode = "add" | "edit" | "view" | null;

const emptyForm = {
  name: "",
  code: "",
  startTime: "09:00",
  endTime: "17:00",
  breakDuration: "60",
  color: "#6366F1",
  status: "active" as "active" | "inactive",
};

const shiftColors = [
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

export default function ShiftsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin";

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<Shift[]>("/shifts");
      setShifts(response.data);
    } catch {
      setError("Unable to load shifts. Please check JSON Server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        shift.name.toLowerCase().includes(searchValue) ||
        shift.code.toLowerCase().includes(searchValue) ||
        shift.id.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || shift.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shifts, search, statusFilter]);

  const activeCount = shifts.filter(
    (shift) => shift.status === "active"
  ).length;

  const inactiveCount = shifts.filter(
    (shift) => shift.status === "inactive"
  ).length;

  const totalBreakMinutes = shifts.reduce(
    (total, shift) => total + Number(shift.breakDuration || 0),
    0
  );

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

  const openAddModal = () => {
    setSelectedShift(null);
    setForm(emptyForm);
    setFormError("");
    setModalMode("add");
  };

  const openEditModal = (shift: Shift) => {
    setSelectedShift(shift);
    setForm({
      name: shift.name,
      code: shift.code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: String(shift.breakDuration),
      color: shift.color,
      status: shift.status,
    });
    setFormError("");
    setModalMode("edit");
  };

  const openViewModal = (shift: Shift) => {
    setSelectedShift(shift);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedShift(null);
    setFormError("");
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  };

  const getShiftDuration = (start: string, end: string) => {
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    const startTotal = startHour * 60 + startMinute;
    let endTotal = endHour * 60 + endMinute;

    // Supports overnight shifts, e.g. 22:00 to 06:00.
    if (endTotal <= startTotal) {
      endTotal += 24 * 60;
    }

    return endTotal - startTotal;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) return `${hours}h`;
    if (hours === 0) return `${remainingMinutes}m`;

    return `${hours}h ${remainingMinutes}m`;
  };

  const generateShiftId = () => {
    const highestId = shifts.reduce((highest, shift) => {
      const number = Number(shift.id.replace(/\D/g, ""));
      return Math.max(highest, number);
    }, 0);

    return `SH${String(highestId + 1).padStart(3, "0")}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const breakDuration = Number(form.breakDuration);

    if (
      !name ||
      !code ||
      !form.startTime ||
      !form.endTime ||
      form.breakDuration === ""
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (!/^[A-Z0-9-]{2,10}$/.test(code)) {
      setFormError(
        "Shift code must be 2–10 characters using letters, numbers or hyphens."
      );
      return;
    }

    if (
      !Number.isInteger(breakDuration) ||
      breakDuration < 0 ||
      breakDuration > 240
    ) {
      setFormError("Break duration must be between 0 and 240 minutes.");
      return;
    }

    const duration = getShiftDuration(form.startTime, form.endTime);

    if (duration <= 0 || duration > 24 * 60) {
      setFormError("Please enter a valid shift duration.");
      return;
    }

    if (breakDuration >= duration) {
      setFormError("Break duration must be shorter than the shift duration.");
      return;
    }

    const duplicateName = shifts.some(
      (shift) =>
        shift.name.toLowerCase() === name.toLowerCase() &&
        shift.id !== selectedShift?.id
    );

    const duplicateCode = shifts.some(
      (shift) =>
        shift.code.toLowerCase() === code.toLowerCase() &&
        shift.id !== selectedShift?.id
    );

    if (duplicateName) {
      setFormError("A shift with this name already exists.");
      return;
    }

    if (duplicateCode) {
      setFormError("A shift with this code already exists.");
      return;
    }

    try {
      setSaving(true);

      const shiftData = {
        name,
        code,
        startTime: form.startTime,
        endTime: form.endTime,
        breakDuration,
        color: form.color,
        status: form.status,
      };

      if (modalMode === "add") {
        const newShift: Shift = {
          id: generateShiftId(),
          ...shiftData,
        };

        const response = await api.post<Shift>("/shifts", newShift);

        setShifts((previous) => [...previous, response.data]);
      }

      if (modalMode === "edit" && selectedShift) {
        const updatedShift: Shift = {
          ...selectedShift,
          ...shiftData,
        };

        const response = await api.put<Shift>(
          `/shifts/${selectedShift.id}`,
          updatedShift
        );

        setShifts((previous) =>
          previous.map((shift) =>
            shift.id === selectedShift.id ? response.data : shift
          )
        );
      }

      closeModal();
    } catch {
      setFormError("Unable to save shift. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (shift: Shift) => {
    const updatedStatus =
      shift.status === "active" ? "inactive" : "active";

    try {
      await api.patch(`/shifts/${shift.id}`, {
        status: updatedStatus,
      });

      setShifts((previous) =>
        previous.map((item) =>
          item.id === shift.id
            ? { ...item, status: updatedStatus }
            : item
        )
      );
    } catch {
      setError("Unable to update shift status.");
    }
  };

  const deleteShift = async (shift: Shift) => {
    try {
      const [assignmentResponse, rotationResponse] = await Promise.all([
        api.get<Assignment[]>("/assignments"),
        api.get<RotationRule[]>("/rotationRules"),
      ]);

      const hasAssignments = assignmentResponse.data.some(
        (assignment) => assignment.shiftId === shift.id
      );

      const hasRotationRules = rotationResponse.data.some((rule) =>
        rule.shiftSequence.includes(shift.id)
      );

      if (hasAssignments || hasRotationRules) {
        window.alert(
          "This shift is being used in assignments or rotation rules. Remove those references before deleting the shift."
        );
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete ${shift.name}?`
      );

      if (!confirmed) return;

      await api.delete(`/shifts/${shift.id}`);

      setShifts((previous) =>
        previous.filter((item) => item.id !== shift.id)
      );
    } catch {
      setError("Unable to delete shift. Please try again.");
    }
  };

  return (
    <DashboardLayout onSearch={setSearch}>
      <div className="space-y-6 p-1">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Shift Management
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create and manage employee shifts and working hours.
            </p>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90"
            >
              <Plus size={18} />
              Add Shift
            </button>
          )}
        </div>

        {!canManage && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            You can view shift information. Only administrators can manage shifts.
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Shifts"
            value={shifts.length}
            icon={<Clock3 size={21} />}
            color="blue"
          />
          <StatCard
            title="Active Shifts"
            value={activeCount}
            icon={<CheckCircle2 size={21} />}
            color="green"
          />
          <StatCard
            title="Inactive Shifts"
            value={inactiveCount}
            icon={<XCircle size={21} />}
            color="orange"
          />
          <StatCard
            title="Total Break Minutes"
            value={totalBreakMinutes}
            icon={<Timer size={21} />}
            color="violet"
          />
        </div>

        {/* Search and filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by shift name, code or ID..."
                className={`${inputClass} pl-11`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputClass} sm:w-48`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} />
              Reset
            </button>
          </div>
        </div>

        {/* Shift table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              All Shifts
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredShifts.length} of {shifts.length} shifts
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={fetchShifts}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="p-12 text-center">
              <Clock3
                size={36}
                className="mx-auto text-slate-300 dark:text-slate-600"
              />
              <p className="mt-3 font-semibold text-slate-700 dark:text-white">
                No shifts found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Shift</th>
                    <th className="px-5 py-4 font-semibold">Code</th>
                    <th className="px-5 py-4 font-semibold">Working Hours</th>
                    <th className="px-5 py-4 font-semibold">Break</th>
                    <th className="px-5 py-4 font-semibold">Duration</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredShifts.map((shift) => (
                    <tr
                      key={shift.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                            style={{ backgroundColor: shift.color }}
                          >
                            <Clock3 size={19} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {shift.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {shift.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {shift.code}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {shift.startTime} – {shift.endTime}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {shift.endTime <= shift.startTime
                            ? "Overnight shift"
                            : "Same-day shift"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {shift.breakDuration} min
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {formatDuration(
                          getShiftDuration(shift.startTime, shift.endTime)
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            shift.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {shift.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <ActionButton
                            title="View"
                            onClick={() => openViewModal(shift)}
                          >
                            <Eye size={17} />
                          </ActionButton>

                          {canManage && (
                            <>
                              <ActionButton
                                title="Edit"
                                onClick={() => openEditModal(shift)}
                              >
                                <Pencil size={17} />
                              </ActionButton>

                              <ActionButton
                                title={
                                  shift.status === "active"
                                    ? "Deactivate"
                                    : "Activate"
                                }
                                onClick={() => toggleStatus(shift)}
                              >
                                {shift.status === "active" ? (
                                  <XCircle size={17} />
                                ) : (
                                  <CheckCircle2 size={17} />
                                )}
                              </ActionButton>

                              <ActionButton
                                title="Delete"
                                danger
                                onClick={() => deleteShift(shift)}
                              >
                                <Trash2 size={17} />
                              </ActionButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
          <div className="shift-modal-scroll my-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === "add"
                    ? "Add New Shift"
                    : modalMode === "edit"
                      ? "Edit Shift"
                      : "Shift Details"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {modalMode === "view"
                    ? "Shift information and working hours"
                    : "Enter the shift details below"}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {modalMode === "view" && selectedShift ? (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: selectedShift.color }}
                  >
                    <Clock3 size={27} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {selectedShift.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedShift.code} · {selectedShift.id}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {selectedShift.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Start Time" value={selectedShift.startTime} />
                  <DetailItem label="End Time" value={selectedShift.endTime} />
                  <DetailItem
                    label="Break Duration"
                    value={`${selectedShift.breakDuration} minutes`}
                  />
                  <DetailItem
                    label="Total Duration"
                    value={formatDuration(
                      getShiftDuration(
                        selectedShift.startTime,
                        selectedShift.endTime
                      )
                    )}
                  />
                  <DetailItem
                    label="Shift Code"
                    value={selectedShift.code}
                  />
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                    <Palette size={17} className="text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-500">Shift Color</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded-md"
                          style={{ backgroundColor: selectedShift.color }}
                        />
                        <span className="text-sm font-semibold text-slate-800 dark:text-white">
                          {selectedShift.color}
                        </span>
                      </div>
                    </div>
                  </div>
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
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {formError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Shift Name">
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Example: Morning Shift"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Shift Code">
                    <input
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      placeholder="Example: MOR"
                      maxLength={10}
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Start Time">
                    <input
                      name="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="End Time">
                    <input
                      name="endTime"
                      type="time"
                      value={form.endTime}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Break Duration (minutes)">
                    <input
                      name="breakDuration"
                      type="number"
                      min="0"
                      max="240"
                      value={form.breakDuration}
                      onChange={handleChange}
                      placeholder="60"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Shift Status">
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </FormField>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Shift Color
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {shiftColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Select ${color}`}
                        aria-pressed={form.color === color}
                        onClick={() =>
                          setForm((previous) => ({ ...previous, color }))
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                          form.color === color
                            ? "ring-2 ring-offset-2 ring-slate-500 dark:ring-offset-slate-900"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {form.color === color && (
                          <CheckCircle2 size={18} className="text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    SHIFT DURATION PREVIEW
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {form.startTime && form.endTime
                      ? formatDuration(
                          getShiftDuration(form.startTime, form.endTime)
                        )
                      : "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Includes break time. Break: {form.breakDuration || 0} minutes.
                  </p>
                </div>

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
                        ? "Add Shift"
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
