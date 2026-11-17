
import { type ReactNode } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import LoginPage from "./components/auth/LoginPage";
import SignUpPage from "./components/auth/SignUpPage";
import ForgotPasswordPage from "./components/auth/ForgotPasswordPage";
import ResetPasswordPage from "./components/auth/ResetPasswordPage";
import LockScreenPage from "./components/auth/LockScreenPage";

import NotFoundPage from "./components/errors/NotFoundPage";
import ServerErrorPage from "./components/errors/ServerErrorPage";

import DashboardPage from "./components/dashboard/DashboardPage";
import EmployeesPage from "./components/employees/EmployeesPage";
import DepartmentsPage from "./components/departments/DepartmentsPage";
import ShiftsPage from "./components/shifts/ShiftsPage";
import AssignmentsPage from "./components/assignments/AssignmentsPage";
import RotationsPage from "./components/rotations/RotationsPage";
import RosterPage from "./components/roster/RosterPage";
import MySchedulePage from "./components/my-schedule/MySchedulePage";
import NotificationsPage from "./components/notifications/NotificationsPage";
import ReportsPage from "./components/reports/ReportsPage";

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/lock-screen" element={<LockScreenPage />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleRoute>
              <DashboardPage />
            </RoleRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/employees"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <EmployeesPage />
            </RoleRoute>
          }
        />

        <Route
          path="/departments"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <DepartmentsPage />
            </RoleRoute>
          }
        />

        {/* Admin and Manager */}
        <Route
          path="/shifts"
          element={
            <RoleRoute allowedRoles={["admin", "manager"]}>
              <ShiftsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/rotations"
          element={
            <RoleRoute allowedRoles={["admin", "manager"]}>
              <RotationsPage />
            </RoleRoute>
          }
        />

        {/* All authenticated users */}
        <Route
          path="/assignments"
          element={
            <RoleRoute>
              <AssignmentsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/roster"
          element={
            <RoleRoute>
              <RosterPage />
            </RoleRoute>
          }
        />

        <Route
          path="/my-schedule"
          element={
            <RoleRoute>
              <MySchedulePage />
            </RoleRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <RoleRoute>
              <NotificationsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <RoleRoute>
              <ReportsPage />
            </RoleRoute>
          }
        />

        {/* Error Pages */}
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
