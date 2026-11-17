
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Users,
  UserRound,
  Pencil,
  Eye,
  Trash2,
  X,
  RefreshCw,
  UserCheck,
  UserX,
} from "lucide-react";
import DashboardLayout from "../dashboard/DashboardLayout";
import api from "../../services/api";

interface Department {
  id: string;
  name: string;
  code: string;
  manager: string;
  employeeCount: number;
  status: "active" | "inactive";
}

interface Employee {
  id: string;
  name: string;
  department: string;
  status: string;
}

type ModalMode = "add" | "edit" | "view" | null;

const emptyForm = {
  name: "",
  code: "",
  manager: "",
  status: "active" as "active" | "inactive",
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [departmentResponse, employeeResponse] = await Promise.all([
        api.get<Department[]>("/departments"),
        api.get<Employee[]>("/employees"),
      ]);

      setDepartments(departmentResponse.data);
      setEmployees(employeeResponse.data);
    } catch {
      setError("Unable to load department data. Please check JSON Server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        department.name.toLowerCase().includes(searchValue) ||
        department.code.toLowerCase().includes(searchValue) ||
        department.manager.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || department.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [departments, search, statusFilter]);

  const activeCount = departments.filter(
    (department) => department.status === "active"
  ).length;

  const inactiveCount = departments.filter(
    (department) => department.status === "inactive"
  ).length;

  const totalEmployees = departments.reduce(
    (total, department) => total + Number(department.employeeCount || 0),
    0
  );

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

  const openAddModal = () => {
    setSelectedDepartment(null);
    setForm(emptyForm);
    setFormError("");
    setModalMode("add");
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setForm({
      name: department.name,
      code: department.code,
      manager: department.manager,
      status: department.status,
    });
    setFormError("");
    setModalMode("edit");
  };

  const openViewModal = (department: Department) => {
    setSelectedDepartment(department);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedDepartment(null);
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

  const generateDepartmentId = () => {
    const highestId = departments.reduce(
      (highest, department) =>
        Math.max(highest, Number(department.id) || 0),
      0
    );

    return String(highestId + 1);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();

    if (!name || !code || !form.manager || !form.status) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (!/^[A-Z0-9-]{2,10}$/.test(code)) {
      setFormError(
        "Department code must be 2–10 characters using letters, numbers or hyphens."
      );
      return;
    }

    const duplicateName = departments.some(
      (department) =>
        department.name.toLowerCase() === name.toLowerCase() &&
        department.id !== selectedDepartment?.id
    );

    const duplicateCode = departments.some(
      (department) =>
        department.code.toLowerCase() === code.toLowerCase() &&
        department.id !== selectedDepartment?.id
    );

    if (duplicateName) {
      setFormError("This department name already exists.");
      return;
    }

    if (duplicateCode) {
      setFormError("This department code already exists.");
      return;
    }

    try {
      setSaving(true);

      if (modalMode === "add") {
        const newDepartment: Department = {
          id: generateDepartmentId(),
          name,
          code,
          manager: form.manager,
          employeeCount: 0,
          status: form.status,
        };

        const response = await api.post<Department>(
          "/departments",
          newDepartment
        );

        setDepartments((previous) => [...previous, response.data]);
      }

      if (modalMode === "edit" && selectedDepartment) {
        const updatedDepartment: Department = {
          ...selectedDepartment,
          name,
          code,
          manager: form.manager,
          status: form.status,
        };

        const response = await api.put<Department>(
          `/departments/${selectedDepartment.id}`,
          updatedDepartment
        );

        setDepartments((previous) =>
          previous.map((department) =>
            department.id === selectedDepartment.id
              ? response.data
              : department
          )
        );
      }

      closeModal();
    } catch {
      setFormError("Unable to save department. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (department: Department) => {
    const updatedStatus =
      department.status === "active" ? "inactive" : "active";

    try {
      await api.patch(`/departments/${department.id}`, {
        status: updatedStatus,
      });

      setDepartments((previous) =>
        previous.map((item) =>
          item.id === department.id
            ? { ...item, status: updatedStatus }
            : item
        )
      );
    } catch {
      setError("Unable to update department status.");
    }
  };

  const deleteDepartment = async (department: Department) => {
    const linkedEmployees = employees.filter(
      (employee) => employee.department === department.name
    );

    if (linkedEmployees.length > 0) {
      window.alert(
        `Cannot delete ${department.name}. ${linkedEmployees.length} employee(s) are currently assigned to this department. Reassign them first.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${department.name}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/departments/${department.id}`);

      setDepartments((previous) =>
        previous.filter((item) => item.id !== department.id)
      );
    } catch {
      setError("Unable to delete department. Please try again.");
    }
  };

  return (
    <DashboardLayout onSearch={setSearch}>
      <div className="space-y-6 p-1">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Department Management
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Organize departments, managers and workforce information.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90"
          >
            <Plus size={18} />
            Add Department
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Departments"
            value={departments.length}
            icon={<Building2 size={21} />}
            color="blue"
          />
          <StatCard
            title="Active Departments"
            value={activeCount}
            icon={<UserCheck size={21} />}
            color="green"
          />
          <StatCard
            title="Inactive Departments"
            value={inactiveCount}
            icon={<UserX size={21} />}
            color="orange"
          />
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={<Users size={21} />}
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
                placeholder="Search department, code or manager..."
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

        {/* Department table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                All Departments
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredDepartments.length} of {departments.length} departments
              </p>
            </div>
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
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={fetchData}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="p-12 text-center">
              <Building2
                size={36}
                className="mx-auto text-slate-300 dark:text-slate-600"
              />
              <p className="mt-3 font-semibold text-slate-700 dark:text-white">
                No departments found
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
                    <th className="px-5 py-4 font-semibold">Department</th>
                    <th className="px-5 py-4 font-semibold">Code</th>
                    <th className="px-5 py-4 font-semibold">Manager</th>
                    <th className="px-5 py-4 font-semibold">Employees</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDepartments.map((department) => (
                    <tr
                      key={department.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                            <Building2 size={19} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {department.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Department ID: {department.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {department.code}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <UserRound size={16} className="text-slate-400" />
                          {department.manager}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          <Users size={16} className="text-slate-400" />
                          {department.employeeCount}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            department.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {department.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <ActionButton
                            title="View"
                            onClick={() => openViewModal(department)}
                          >
                            <Eye size={17} />
                          </ActionButton>
                          <ActionButton
                            title="Edit"
                            onClick={() => openEditModal(department)}
                          >
                            <Pencil size={17} />
                          </ActionButton>
                          <ActionButton
                            title={
                              department.status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                            onClick={() => toggleStatus(department)}
                          >
                            {department.status === "active" ? (
                              <UserX size={17} />
                            ) : (
                              <UserCheck size={17} />
                            )}
                          </ActionButton>
                          <ActionButton
                            title="Delete"
                            danger
                            onClick={() => deleteDepartment(department)}
                          >
                            <Trash2 size={17} />
                          </ActionButton>
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

      {/* Department modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="department-modal-scroll my-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === "add"
                    ? "Add Department"
                    : modalMode === "edit"
                      ? "Edit Department"
                      : "Department Details"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {modalMode === "view"
                    ? "Department information"
                    : "Enter the department details below"}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {modalMode === "view" && selectedDepartment ? (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    <Building2 size={27} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {selectedDepartment.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedDepartment.code} · ID {selectedDepartment.id}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {selectedDepartment.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Department Manager"
                    value={selectedDepartment.manager}
                    icon={<UserRound size={17} />}
                  />
                  <DetailItem
                    label="Employee Count"
                    value={String(selectedDepartment.employeeCount)}
                    icon={<Users size={17} />}
                  />
                  <DetailItem
                    label="Department Code"
                    value={selectedDepartment.code}
                    icon={<Building2 size={17} />}
                  />
                  <DetailItem
                    label="Department Status"
                    value={selectedDepartment.status}
                    icon={<UserCheck size={17} />}
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
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  <FormField label="Department Name">
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter department name"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Department Code">
                    <input
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      placeholder="Example: ENG"
                      maxLength={10}
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Department Manager">
                    <select
                      name="manager"
                      value={form.manager}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select manager</option>
                      {employees
                        .filter((employee) => employee.status === "active")
                        .map((employee) => (
                          <option key={employee.id} value={employee.name}>
                            {employee.name}
                          </option>
                        ))}
                    </select>
                  </FormField>

                  <FormField label="Department Status">
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

                {modalMode === "edit" && selectedDepartment && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Employee count: {selectedDepartment.employeeCount}. This
                    value is maintained separately from department details.
                  </p>
                )}

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
                        ? "Add Department"
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
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
      <div className="text-blue-600 dark:text-blue-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs capitalize text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold capitalize text-slate-800 dark:text-white">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
