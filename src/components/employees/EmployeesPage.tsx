
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  Pencil,
  Eye,
  Trash2,
  X,
  RefreshCw,
  Briefcase,
  Mail,
  Phone,
  CalendarDays,
  Building2,
} from "lucide-react";
import DashboardLayout from "../dashboard/DashboardLayout";
import api from "../../services/api";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: "active" | "inactive";
  phone: string;
  joiningDate: string;
}

interface Department {
  id: string;
  name: string;
}

const emptyForm = {
  name: "",
  email: "",
  department: "",
  designation: "",
  status: "active" as "active" | "inactive",
  phone: "",
  joiningDate: new Date().toISOString().split("T")[0],
};

type ModalMode = "add" | "edit" | "view" | null;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [employeeResponse, departmentResponse] = await Promise.all([
        api.get<Employee[]>("/employees"),
        api.get<Department[]>("/departments"),
      ]);

      setEmployees(employeeResponse.data);
      setDepartments(departmentResponse.data);
    } catch {
      setError("Unable to load employee data. Please check JSON Server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        employee.name.toLowerCase().includes(searchValue) ||
        employee.id.toLowerCase().includes(searchValue) ||
        employee.email.toLowerCase().includes(searchValue) ||
        employee.designation.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || employee.status === statusFilter;

      const matchesDepartment =
        departmentFilter === "all" ||
        employee.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [employees, search, statusFilter, departmentFilter]);

  const activeCount = employees.filter(
    (employee) => employee.status === "active"
  ).length;

  const inactiveCount = employees.filter(
    (employee) => employee.status === "inactive"
  ).length;

  const openAddModal = () => {
    setSelectedEmployee(null);
    setForm({
      ...emptyForm,
      department: departments[0]?.name || "",
    });
    setFormError("");
    setModalMode("add");
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setForm({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
      phone: employee.phone,
      joiningDate: employee.joiningDate,
    });
    setFormError("");
    setModalMode("edit");
  };

  const openViewModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedEmployee(null);
    setFormError("");
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const generateEmployeeId = () => {
    const highestId = employees.reduce((highest, employee) => {
      const number = Number(employee.id.replace(/\D/g, ""));
      return Math.max(highest, number);
    }, 0);

    return `EMP${String(highestId + 1).padStart(3, "0")}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.department ||
      !form.designation.trim() ||
      !form.phone.trim() ||
      !form.joiningDate
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    const emailExists = employees.some(
      (employee) =>
        employee.email.toLowerCase() === form.email.trim().toLowerCase() &&
        employee.id !== selectedEmployee?.id
    );

    if (emailExists) {
      setFormError("An employee with this email already exists.");
      return;
    }

    try {
      setSaving(true);

      if (modalMode === "add") {
        const newEmployee: Employee = {
          ...form,
          id: generateEmployeeId(),
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          designation: form.designation.trim(),
        };

        const response = await api.post<Employee>(
          "/employees",
          newEmployee
        );

        setEmployees((previous) => [...previous, response.data]);
      } else if (modalMode === "edit" && selectedEmployee) {
        const updatedEmployee: Employee = {
          ...selectedEmployee,
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          designation: form.designation.trim(),
        };

        const response = await api.patch<Employee>(
          `/employees/${selectedEmployee.id}`,
          updatedEmployee
        );

        setEmployees((previous) =>
          previous.map((employee) =>
            employee.id === selectedEmployee.id ? response.data : employee
          )
        );
      }

      closeModal();
    } catch {
      setFormError("Unable to save employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (employee: Employee) => {
    const updatedStatus =
      employee.status === "active" ? "inactive" : "active";

    try {
      await api.patch(`/employees/${employee.id}`, {
        status: updatedStatus,
      });

      setEmployees((previous) =>
        previous.map((item) =>
          item.id === employee.id
            ? { ...item, status: updatedStatus }
            : item
        )
      );
    } catch {
      setError("Unable to update employee status. Please try again.");
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.name}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/employees/${employee.id}`);

      setEmployees((previous) =>
        previous.filter((item) => item.id !== employee.id)
      );
    } catch {
      setError("Unable to delete employee. Please try again.");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

  return (
   <DashboardLayout onSearch={(value) => setSearch(value)}>
       <div className="mx-auto w-full max-w-[1800px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Employee Management
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage employees, departments and employee information.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Employee
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Employees"
            value={employees.length}
            icon={<Users size={21} />}
            color="blue"
          />
          <StatCard
            title="Active Employees"
            value={activeCount}
            icon={<UserCheck size={21} />}
            color="green"
          />
          <StatCard
            title="Inactive Employees"
            value={inactiveCount}
            icon={<UserX size={21} />}
            color="orange"
          />
        </div>

        {/* Search and filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, ID, email or designation..."
                className={`${inputClass} pl-11`}
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className={`${inputClass} lg:w-52`}
            >
              <option value="all">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputClass} lg:w-44`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDepartmentFilter("all");
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} />
              Reset
            </button>
          </div>
        </div>

        {/* Employee table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                All Employees
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredEmployees.length} of {employees.length} employees
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
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <Users
                size={36}
                className="mx-auto text-slate-300 dark:text-slate-600"
              />
              <p className="mt-3 font-semibold text-slate-700 dark:text-white">
                No employees found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Employee</th>
                    <th className="px-5 py-4 font-semibold">Department</th>
                    <th className="px-5 py-4 font-semibold">Designation</th>
                    <th className="px-5 py-4 font-semibold">Phone</th>
                    <th className="px-5 py-4 font-semibold">Joining Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                            {employee.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {employee.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {employee.id} · {employee.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {employee.department}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {employee.designation}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {employee.phone}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(employee.joiningDate).toLocaleDateString("en-IN")}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            employee.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {employee.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <ActionButton
                            title="View"
                            onClick={() => openViewModal(employee)}
                          >
                            <Eye size={17} />
                          </ActionButton>
                          <ActionButton
                            title="Edit"
                            onClick={() => openEditModal(employee)}
                          >
                            <Pencil size={17} />
                          </ActionButton>
                          <ActionButton
                            title={
                              employee.status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                            onClick={() => toggleStatus(employee)}
                          >
                            {employee.status === "active" ? (
                              <UserX size={17} />
                            ) : (
                              <UserCheck size={17} />
                            )}
                          </ActionButton>
                          <ActionButton
                            title="Delete"
                            onClick={() => deleteEmployee(employee)}
                            danger
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

      {/* Add / Edit / View modal */}
      {modalMode && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="my-auto max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalMode === "add"
                    ? "Add New Employee"
                    : modalMode === "edit"
                      ? "Edit Employee"
                      : "Employee Details"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {modalMode === "view"
                    ? "Employee profile information"
                    : "Enter the employee information below"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {modalMode === "view" && selectedEmployee ? (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {selectedEmployee.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {selectedEmployee.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedEmployee.id}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    icon={<Mail size={17} />}
                    label="Email"
                    value={selectedEmployee.email}
                  />
                  <DetailItem
                    icon={<Phone size={17} />}
                    label="Phone"
                    value={selectedEmployee.phone}
                  />
                  <DetailItem
                    icon={<Building2 size={17} />}
                    label="Department"
                    value={selectedEmployee.department}
                  />
                  <DetailItem
                    icon={<Briefcase size={17} />}
                    label="Designation"
                    value={selectedEmployee.designation}
                  />
                  <DetailItem
                    icon={<CalendarDays size={17} />}
                    label="Joining Date"
                    value={selectedEmployee.joiningDate}
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Employee Name">
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="Enter employee name"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Email Address">
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder="name@example.com"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Department">
                    <select
                      name="department"
                      value={form.department}
                      onChange={handleFormChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.name}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Designation">
                    <input
                      name="designation"
                      value={form.designation}
                      onChange={handleFormChange}
                      placeholder="Enter designation"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Phone Number">
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="Enter phone number"
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Joining Date">
                    <input
                      name="joiningDate"
                      type="date"
                      value={form.joiningDate}
                      onChange={handleFormChange}
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Employee Status">
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                      className={inputClass}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </FormField>
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
                        ? "Add Employee"
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
  color: "blue" | "green" | "orange";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
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
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-white">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
