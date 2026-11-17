
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  CalendarDays,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const LockScreenPage = () => {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === "dark";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (!user?.email) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    try {
      setLoading(true);
      await login(user.email, password);
      navigate("/dashboard");
    } catch {
      setError("Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-[#111936] md:h-dvh md:min-h-0 md:overflow-hidden">

      {/* Background image - same as Login page */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=2000&q=90')",
        }}
      />

      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#10183e]/85 via-[#18245b]/80 to-[#352078]/75" />

      {/* Subtle background highlights */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[350px] w-[350px] rounded-full bg-blue-500/15 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[350px] w-[350px] rounded-full bg-violet-500/15 blur-[110px]" />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-lg transition hover:bg-white/25 sm:right-6 sm:top-6 sm:h-11 sm:w-11"
      >
        {isDark ? <Sun size={19} /> : <Moon size={19} />}
      </button>

      {/* Main layout */}
      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-[1800px] grid-cols-1 items-center gap-6 px-4 py-16 sm:px-8 md:h-full md:min-h-0 md:grid-cols-2 md:gap-5 md:px-6 md:py-3 lg:gap-8 lg:px-10 xl:gap-12 xl:px-16 2xl:px-24">

        {/* LEFT SIDE */}
        <section className="hidden min-h-0 flex-col justify-center md:flex">

          {/* Logo and brand */}
          <div className="mb-5 flex items-center gap-3 lg:mb-7">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-md lg:h-12 lg:w-12">
              <CalendarDays size={23} />
            </div>

            <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md lg:text-3xl">
              ShiftSync
            </span>
          </div>

          {/* Main content */}
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100 sm:text-sm">
              Employee Shift Management
            </p>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] lg:text-4xl xl:text-5xl 2xl:text-6xl">
              Welcome back!
              <br />
              Your workspace
              <br />
              is waiting for you.
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:text-base lg:mt-4 lg:text-lg lg:leading-7">
              Your session is currently locked. Enter your password to
              securely unlock your workspace and continue managing your
              shifts, schedules and daily activities.
            </p>
          </div>

          {/* Security information */}
          <div className="mt-5 flex max-w-md items-center gap-3 rounded-2xl border border-white/20 bg-slate-950/25 p-3 shadow-lg backdrop-blur-md lg:mt-6 lg:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white lg:text-base">
                Your account is protected
              </h3>

              <p className="mt-1 text-xs leading-5 text-blue-100 lg:text-sm">
                Your workspace stays secure while you are away.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-5 text-xs text-white/75 lg:mt-6 lg:text-sm">
            © {new Date().getFullYear()} ShiftSync. All rights reserved.
          </p>
        </section>

        {/* RIGHT SIDE - LOCK SCREEN CARD */}
        <section className="flex w-full min-w-0 items-center justify-center md:h-full md:min-h-0 md:py-1">
          <div
            className={`w-full max-w-[410px] rounded-3xl border p-4 shadow-2xl backdrop-blur-xl transition-colors duration-300 sm:p-5 md:p-4 lg:p-5 xl:p-6 ${
              isDark
                ? "border-slate-700/70 bg-[#111827]/95 text-white shadow-black/30"
                : "border-white/50 bg-white/[0.97] text-slate-900 shadow-black/25"
            }`}
          >
            {/* Mobile brand */}
            <div className="mb-3 flex items-center justify-center gap-2 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                <CalendarDays size={20} />
              </div>

              <span
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                ShiftSync
              </span>
            </div>

            {/* Lock icon */}
            <div className="mb-3 flex justify-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isDark
                    ? "bg-blue-500/15 text-blue-300"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <LockKeyhole size={24} />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center">
              <h2
                className={`text-xl font-bold tracking-tight sm:text-2xl ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Session Locked
              </h2>

              <p
                className={`mx-auto mt-1 max-w-xs text-xs leading-5 sm:text-sm ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Welcome back! Enter your password to unlock your account.
              </p>
            </div>

            {/* User details */}
            <div
              className={`mt-4 flex items-center gap-3 rounded-xl border p-3 ${
                isDark
                  ? "border-slate-700 bg-slate-800/70"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0 flex-1">
                <h3
                  className={`truncate text-sm font-semibold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {user?.name || "User"}
                </h3>

                <p
                  className={`mt-0.5 truncate text-xs ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {user?.email || "No email available"}
                </p>

                {user?.employeeId && (
                  <p
                    className={`mt-0.5 text-xs ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {user.employeeId}
                  </p>
                )}
              </div>
            </div>

            {/* Password form */}
            <form onSubmit={handleUnlock} className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="lock-password"
                  className={`mb-1.5 block text-sm font-medium ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="lock-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`h-10 w-full rounded-xl border px-4 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition ${
                      isDark
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
                >
                  {error}
                </p>
              )}

              {/* Unlock button */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Unlocking..." : "Unlock Workspace"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            {/* Forgot password */}
            <div className="mt-3 text-center">
              <Link
                to="/reset-password"
                className={`text-sm font-medium transition ${
                  isDark
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                Forgot your password?
              </Link>
            </div>

            {/* Sign out */}
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={handleSignOut}
                className={`flex items-center gap-2 text-xs font-medium transition sm:text-sm ${
                  isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LogOut size={15} />
                Sign out and switch account
              </button>
            </div>

            {/* Security footer */}
            <div
              className={`mt-4 border-t pt-3 text-center text-xs ${
                isDark
                  ? "border-slate-700 text-slate-500"
                  : "border-slate-200 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck size={14} />
                Your session is secure and protected
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LockScreenPage;
