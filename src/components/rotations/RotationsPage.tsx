
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RotateCw,
  Pencil,
  Trash2,
  Eye,
  X,
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Power,
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
  color: string;
  status: "active" | "inactive";
}

interface Department {
  id: string;
  name: string;
  code: string;
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

interface RotationForm {
  name: string;
  department: string;
  pattern: "weekly" | "monthly";
  shiftSequence: string[];
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
}

const initialForm: RotationForm = {
  name: "",
  department: "",
  pattern: "weekly",
  shiftSequence: [],
  startDate: "",
  endDate: "",
  status: "active",
};

// Validate YYYY-MM-DD without UTC conversion.
const isValidDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const RotationsPage = () => {
  const { user } = useAuth();

  const [rules, setRules] = useState<RotationRule[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [patternFilter, setPatternFilter] = useState("all");

  const [modalMode, setModalMode] = useState<
    "add" | "edit" | "view" | null
  >(null);

  const [selectedRule, setSelectedRule] =
    useState<RotationRule | null>(null);

  const [form, setForm] = useState<RotationForm>(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const canManage =
    user?.role === "admin" || user?.role === "manager";

  // Load rotation rules, shifts and departments.
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [rulesRes, shiftsRes, departmentsRes] = await Promise.all([
        api.get<RotationRule[]>("/rotationRules"),
        api.get<Shift[]>("/shifts"),
        api.get<Department[]>("/departments"),
      ]);

      setRules(rulesRes.data);
      setShifts(shiftsRes.data);
      setDepartments(departmentsRes.data);
    } catch {
      setError(
        "Unable to load rotation rules. Please check the server.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Statistics.
  const activeRules = rules.filter(
    (rule) => rule.status === "active",
  );

  const weeklyRules = rules.filter(
    (rule) => rule.pattern === "weekly",
  );

  const monthlyRules = rules.filter(
    (rule) => rule.pattern === "monthly",
  );

  // Search and filters.
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      const searchMatch =
        rule.name.toLowerCase().includes(search.toLowerCase()) ||
        rule.department.toLowerCase().includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "all" || rule.status === statusFilter;

      const patternMatch =
        patternFilter === "all" || rule.pattern === patternFilter;

      return searchMatch && statusMatch && patternMatch;
    });
  }, [rules, search, statusFilter, patternFilter]);

  // Find shift details.
  const getShift = (shiftId: string) =>
    shifts.find((shift) => shift.id === shiftId);

  // Generate the next rotation ID.
  const getNextId = () => {
    const highest = rules.reduce((max, rule) => {
      const number = Number(rule.id.replace("ROT", ""));

      return Number.isNaN(number)
        ? max
        : Math.max(max, number);
    }, 0);

    return `ROT${String(highest + 1).padStart(3, "0")}`;
  };

  // Open create modal.
  const openAddModal = () => {
    setForm(initialForm);
    setSelectedRule(null);
    setFormError("");
    setModalMode("add");
  };

  // Open edit modal.
  const openEditModal = (rule: RotationRule) => {
    setSelectedRule(rule);

    setForm({
      name: rule.name,
      department: rule.department,
      pattern: rule.pattern,
      shiftSequence: [...rule.shiftSequence],
      startDate: rule.startDate,
      endDate: rule.endDate,
      status: rule.status,
    });

    setFormError("");
    setModalMode("edit");
  };

  // Open view modal.
  const openViewModal = (rule: RotationRule) => {
    setSelectedRule(rule);
    setModalMode("view");
  };

  // Close modal.
  const closeModal = () => {
    setModalMode(null);
    setSelectedRule(null);
    setForm(initialForm);
    setFormError("");
  };

  // Select or remove a shift from the rotation sequence.
  const toggleShift = (shiftId: string) => {
    setForm((previous) => ({
      ...previous,
      shiftSequence: previous.shiftSequence.includes(shiftId)
        ? previous.shiftSequence.filter((id) => id !== shiftId)
        : [...previous.shiftSequence, shiftId],
    }));
  };

  // Validate the form.
  const validateForm = (): string => {
    if (!form.name.trim()) {
      return "Please enter a rotation rule name.";
    }

    if (!form.department) {
      return "Please select a department.";
    }

    if (form.shiftSequence.length < 2) {
      return "Select at least two shifts for the rotation sequence.";
    }

    if (!form.startDate || !form.endDate) {
      return "Please select both start and end dates.";
    }

    // Corrected date validation for IST and other timezones.
    if (
      !isValidDate(form.startDate) ||
      !isValidDate(form.endDate)
    ) {
      return "Please enter valid dates.";
    }

    // YYYY-MM-DD strings can be compared chronologically.
    if (form.endDate < form.startDate) {
      return "End date must be after the start date.";
    }

    const duplicate = rules.some(
      (rule) =>
        rule.id !== selectedRule?.id &&
        rule.name.trim().toLowerCase() ===
          form.name.trim().toLowerCase(),
    );

    if (duplicate) {
      return "A rotation rule with this name already exists.";
    }

    return "";
  };

  // Save activity history.
  const writeActivityLog = async (
    action: string,
    description: string,
  ) => {
    try {
      await api.post("/activityLogs", {
        id: `LOG${Date.now()}`,
        user: user?.name || "Unknown User",
        action,
        module: "Rotations",
        description,
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      console.warn(
        "Activity log could not be saved.",
        logError,
      );
    }
  };

  // Create or update rotation rule.
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload: RotationRule = {
        id: selectedRule?.id || getNextId(),
        name: form.name.trim(),
        department: form.department,
        pattern: form.pattern,
        shiftSequence: form.shiftSequence,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      };

      if (modalMode === "edit" && selectedRule) {
        await api.put(
          `/rotationRules/${selectedRule.id}`,
          payload,
        );

        await writeActivityLog(
          "Updated rotation rule",
          `Updated ${payload.name} for ${payload.department}.`,
        );

        setSuccess("Rotation rule updated successfully.");
      } else {
        await api.post("/rotationRules", payload);

        await writeActivityLog(
          "Created rotation rule",
          `Created ${payload.name} for ${payload.department}.`,
        );

        setSuccess("Rotation rule created successfully.");
      }

      closeModal();
      await loadData();
    } catch (submitError) {
      console.error("Rotation rule save error:", submitError);

      setFormError(
        "Unable to save the rotation rule. Please check JSON Server and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate a rule.
  const toggleStatus = async (rule: RotationRule) => {
    try {
      const newStatus =
        rule.status === "active" ? "inactive" : "active";

      await api.patch(`/rotationRules/${rule.id}`, {
        status: newStatus,
      });

      await writeActivityLog(
        newStatus === "active"
          ? "Activated rotation rule"
          : "Deactivated rotation rule",
        `${rule.name} was ${newStatus}.`,
      );

      setSuccess(
        `Rotation rule ${newStatus} successfully.`,
      );

      await loadData();
    } catch {
      setError("Unable to update rotation rule status.");
    }
  };

  // Delete a rule.
  const deleteRule = async (rule: RotationRule) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${rule.name}"?`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/rotationRules/${rule.id}`);

      await writeActivityLog(
        "Deleted rotation rule",
        `Deleted ${rule.name}.`,
      );

      setSuccess("Rotation rule deleted successfully.");

      await loadData();
    } catch {
      setError("Unable to delete this rotation rule.");
    }
  };

  // Format date without UTC conversion.
  const formatDate = (date: string) => {
    if (!date || !isValidDate(date)) return "-";

    const [year, month, day] = date.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  return (
    <DashboardLayout onSearch={setSearch}>
      <div className="min-h-full space-y-6 p-1 sm:p-2">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-violet-100 p-2.5 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                <RotateCw size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Shift Rotation Rules
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Manage recurring employee shift rotation schedules.
                </p>
              </div>
            </div>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <Plus size={18} />
              Create Rotation Rule
            </button>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              {success}
            </span>

            <button onClick={() => setSuccess("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {/* Error Message */}
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

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Rules",
              value: rules.length,
              icon: RotateCw,
              color:
                "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
            },
            {
              label: "Active Rules",
              value: activeRules.length,
              icon: CheckCircle2,
              color:
                "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
            },
            {
              label: "Weekly Rotations",
              value: weeklyRules.length,
              icon: CalendarDays,
              color:
                "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
            },
            {
              label: "Monthly Rotations",
              value: monthlyRules.length,
              icon: Clock3,
              color:
                "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
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

                  <div className={`rounded-xl p-3 ${item.color}`}>
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rotation rules or departments..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <select
            value={patternFilter}
            onChange={(event) => setPatternFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All Patterns</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Rotation Rules Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Rotation Rules
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {filteredRules.length} rule(s) found
              </p>
            </div>

            <RotateCw size={19} className="text-violet-500" />
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <RotateCw size={35} className="text-slate-300" />

              <h3 className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                No rotation rules found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create a rotation rule or change your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Rule Name
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Department
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Pattern
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Shift Sequence
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Duration
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {rule.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {rule.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {rule.department}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          {rule.pattern}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex max-w-64 flex-wrap gap-1.5">
                          {rule.shiftSequence.map(
                            (shiftId, index) => {
                              const shift = getShift(shiftId);

                              return (
                                <span
                                  key={shiftId}
                                  className="rounded-md px-2 py-1 text-xs font-medium text-white"
                                  style={{
                                    backgroundColor:
                                      shift?.color || "#64748b",
                                  }}
                                >
                                  {index + 1}. {shift?.name || shiftId}
                                </span>
                              );
                            },
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(rule.startDate)}
                        <span className="mx-1">–</span>
                        {formatDate(rule.endDate)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            rule.status === "active"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {rule.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openViewModal(rule)}
                            title="View"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-slate-800"
                          >
                            <Eye size={17} />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => openEditModal(rule)}
                                title="Edit"
                                className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800"
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                onClick={() => toggleStatus(rule)}
                                title="Activate / Deactivate"
                                className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-slate-800"
                              >
                                <Power size={17} />
                              </button>

                              <button
                                onClick={() => deleteRule(rule)}
                                title="Delete"
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-800"
                              >
                                <Trash2 size={17} />
                              </button>
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

        {/* Add / Edit / View Modal */}
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {modalMode === "add"
                      ? "Create Rotation Rule"
                      : modalMode === "edit"
                        ? "Edit Rotation Rule"
                        : "Rotation Rule Details"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Configure department rotation and shift sequence.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              {/* View Modal */}
              {modalMode === "view" && selectedRule ? (
                <div className="assignment-modal-scroll space-y-5 overflow-y-auto p-5">
                  <div>
                    <p className="text-xs text-slate-500">
                      Rule Name
                    </p>

                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {selectedRule.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        Department
                      </p>

                      <p className="mt-1 font-medium text-slate-900 dark:text-white">
                        {selectedRule.department}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Pattern
                      </p>

                      <p className="mt-1 font-medium capitalize text-slate-900 dark:text-white">
                        {selectedRule.pattern}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Start Date
                      </p>

                      <p className="mt-1 font-medium text-slate-900 dark:text-white">
                        {formatDate(selectedRule.startDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        End Date
                      </p>

                      <p className="mt-1 font-medium text-slate-900 dark:text-white">
                        {formatDate(selectedRule.endDate)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-xs text-slate-500">
                      Shift Rotation Sequence
                    </p>

                    <div className="space-y-2">
                      {selectedRule.shiftSequence.map(
                        (shiftId, index) => {
                          const shift = getShift(shiftId);

                          return (
                            <div
                              key={shiftId}
                              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                            >
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                                {index + 1}
                              </span>

                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    shift?.color || "#64748b",
                                }}
                              />

                              <span className="font-medium text-slate-800 dark:text-white">
                                {shift?.name || shiftId}
                              </span>

                              <span className="ml-auto text-xs text-slate-500">
                                {shift?.startTime || "--"} –{" "}
                                {shift?.endTime || "--"}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        selectedRule.status === "active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {selectedRule.status}
                    </span>
                  </div>
                </div>
              ) : (
                /* Create / Edit Form */
                <form
                  onSubmit={handleSubmit}
                  className="assignment-modal-scroll space-y-5 overflow-y-auto p-5"
                >
                  {formError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                      {formError}
                    </div>
                  )}

                  {/* Rule Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Rotation Rule Name *
                    </label>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          name: event.target.value,
                        })
                      }
                      placeholder="e.g. Engineering Weekly Rotation"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Department and Pattern */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Department *
                      </label>

                      <select
                        value={form.department}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            department: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">
                          Select Department
                        </option>

                        {departments
                          .filter(
                            (department) =>
                              department.status === "active",
                          )
                          .map((department) => (
                            <option
                              key={department.id}
                              value={department.name}
                            >
                              {department.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Rotation Pattern *
                      </label>

                      <select
                        value={form.pattern}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            pattern: event.target.value as
                              | "weekly"
                              | "monthly",
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Start Date *
                      </label>

                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            startDate: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        End Date *
                      </label>

                      <input
                        type="date"
                        min={form.startDate || undefined}
                        value={form.endDate}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            endDate: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Shift Rotation Sequence */}
                  <div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Shift Rotation Sequence *
                      </label>

                      <p className="mt-1 text-xs text-slate-500">
                        Select shifts in the order they should rotate.
                        Click again to remove a shift.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {shifts
                        .filter(
                          (shift) => shift.status === "active",
                        )
                        .map((shift) => {
                          const selectedIndex =
                            form.shiftSequence.indexOf(shift.id);

                          const isSelected = selectedIndex !== -1;

                          return (
                            <button
                              type="button"
                              key={shift.id}
                              onClick={() => toggleShift(shift.id)}
                              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                                isSelected
                                  ? "border-violet-400 bg-violet-50 dark:border-violet-500 dark:bg-violet-500/10"
                                  : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                              }`}
                            >
                              <span
                                className="h-3.5 w-3.5 rounded-full"
                                style={{
                                  backgroundColor: shift.color,
                                }}
                              />

                              <span className="flex-1">
                                <span className="block text-sm font-medium text-slate-800 dark:text-white">
                                  {shift.name}
                                </span>

                                <span className="text-xs text-slate-500">
                                  {shift.startTime} – {shift.endTime}
                                </span>
                              </span>

                              {isSelected && (
                                <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">
                                  Order {selectedIndex + 1}
                                </span>
                              )}

                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                  isSelected
                                    ? "border-violet-600 bg-violet-600 text-white"
                                    : "border-slate-300 dark:border-slate-600"
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle2 size={14} />
                                )}
                              </span>
                            </button>
                          );
                        })}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Selected shifts: {form.shiftSequence.length}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </label>

                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status: event.target.value as
                            | "active"
                            | "inactive",
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Form Buttons */}
                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Saving..."
                        : modalMode === "edit"
                          ? "Update Rule"
                          : "Create Rule"}
                    </button>
                  </div>
                </form>
              )}

              {/* View Modal Footer */}
              {modalMode === "view" && (
                <div className="flex justify-end border-t border-slate-200 p-4 dark:border-slate-800">
                  <button
                    onClick={closeModal}
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RotationsPage;
