import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Moon,
  Sun,
  Mail,
  ShieldCheck,
  UsersRound,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim();

    const emailRegex =
      /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (normalizedEmail !== normalizedEmail.toLowerCase()) {
      setError("Email address must contain lowercase letters only.");
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const user = await login(normalizedEmail, password);

      localStorage.setItem(
        "shiftsync_remember",
        rememberMe ? "true" : "false"
      );

      navigate("/dashboard", {
        replace: true,
        state: { role: user.role },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: CalendarDays,
      title: "Smart Scheduling",
      description: "Plan shifts effortlessly",
    },
    {
      icon: UsersRound,
      title: "Team Management",
      description: "Keep teams connected",
    },
    {
      icon: Clock3,
      title: "Shift Rotation",
      description: "Automate work schedules",
    },
  ];

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#090d24]">

      {/* Background image */}
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=2000&q=90')",
        }}
      />

      {/* Background overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#10183e]/95 via-[#18245b]/90 to-[#352078]/85" />

      <div className="pointer-events-none absolute -left-40 -top-40 h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[110px]" />

      <div className="pointer-events-none absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/25 blur-[110px]" />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-white/20 sm:right-6 sm:top-5"
      >
        {theme === "dark" ? (
          <Sun size={19} />
        ) : (
          <Moon size={19} />
        )}
      </button>

      {/* Main layout */}
      <div className="relative z-10 mx-auto grid h-full w-full max-w-[1900px] grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">

        {/* LEFT SECTION */}
        <section className="relative hidden h-full min-h-0 flex-col justify-between overflow-hidden px-7 py-6 text-white md:flex lg:px-10 lg:py-7 xl:px-16">

          {/* Brand */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl">
              <CalendarDays size={24} className="text-violet-200" />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
                Shift<span className="text-violet-300">Sync</span>
              </h1>

              <p className="text-[9px] tracking-[2px] text-blue-100/65">
                WORKFORCE MANAGEMENT
              </p>
            </div>
          </div>

          {/* Hero content */}
          <div className="relative z-10 my-auto flex min-h-0 flex-col justify-center py-4 lg:py-5">

            <div className="mt-14">
              
            </div>

            <h2 className="text-[clamp(2rem,3.4vw,3.6rem)] font-bold leading-[1.13] tracking-tight">
              Better Shifts.
              <br />
              Stronger Teams.
              <br />
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Smarter Workdays.
              </span>
            </h2>

            <p className="mt-2 max-w-lg text-xs leading-6 text-blue-100/75 lg:text-sm lg:leading-7">
              Simplify employee scheduling, automate shift rotations and
              manage your entire workforce with one intelligent platform.
            </p>

            {/* Workforce overview card */}
            <div className="mt-2 max-w-[520px] rounded-2xl border border-white/20 bg-white/[0.10] p-4 shadow-xl backdrop-blur-xl lg:mt-6 lg:p-5">

              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-blue-100/60">
                    WORKFORCE OVERVIEW
                  </p>
                  <h3 className="mt-1 text-sm font-bold lg:text-base">
                    Today's schedule
                  </h3>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
                  <CalendarDays size={19} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/15 bg-white/[0.08] p-2.5 lg:p-3">
                  <p className="text-xl font-bold lg:text-2xl">24</p>
                  <p className="mt-1 text-[9px] text-blue-100/65 lg:text-[10px]">
                    Employees
                  </p>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/[0.08] p-2.5 lg:p-3">
                  <p className="text-xl font-bold lg:text-2xl">08</p>
                  <p className="mt-1 text-[9px] text-blue-100/65 lg:text-[10px]">
                    On duty
                  </p>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/[0.08] p-2.5 lg:p-3">
                  <p className="text-xl font-bold lg:text-2xl">03</p>
                  <p className="mt-1 text-[9px] text-blue-100/65 lg:text-[10px]">
                    Shifts
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[10px] text-blue-100/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Your workforce, perfectly organized
              </div>
            </div>

            {/* Compact feature cards */}
            <div className="mt-2 grid grid-cols-3 gap-2 lg:mt-5 lg:gap-3">
              {features.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] p-2 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.13] lg:p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/25 text-violet-200">
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-[9px] font-bold lg:text-[10px]">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 hidden truncate text-[9px] text-blue-100/55 xl:block">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 mt-14 items-center justify-between border-t border-white/15 pt-3 text-[10px] text-blue-100/50">
            <span>© 2026 ShiftSync</span>
            <span>Work smarter. Together.</span>
          </div>

          {/* Decorative circles */}
          <div className="pointer-events-none absolute -bottom-40 -right-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -right-8 h-60 w-60 rounded-full border border-white/10" />
        </section>

        {/* RIGHT LOGIN SECTION */}
        <section className="relative flex h-full min-h-0 items-center justify-center overflow-hidden px-4 py-3 sm:px-8 md:px-5 lg:px-10 xl:px-16">

          {/* Mobile branding */}
          <div className="absolute left-5 top-4 flex items-center gap-2 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 text-white">
              <CalendarDays size={19} />
            </div>

            <span className="text-lg font-bold text-white">
              Shift<span className="text-violet-300">Sync</span>
            </span>
          </div>

          {/* Login card */}
          <div className="relative my-auto w-full max-w-[440px] rounded-[24px] border border-white/40 bg-white/[0.97] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition duration-300 sm:p-7 lg:p-8 dark:border-slate-700/60 dark:bg-[#111827]/95">

            {/* Card heading */}
            <div className="mb-5 text-center">

              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                <ShieldCheck size={23} />
              </div>

              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[2px] text-violet-600 dark:text-violet-400">
                Welcome back
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[27px] dark:text-white">
                Sign in to ShiftSync
              </h2>

              <p className="mt-1.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                Access your workforce dashboard.
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-3.5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Email address
                </label>

                <div className="group relative">
                  <Mail
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-violet-500"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value.toLowerCase())
                    }
                    placeholder="name@company.com"
                    autoComplete="username"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-violet-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                  />
                </div>

                <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                  Email must contain lowercase letters.
                </p>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-semibold text-violet-600 transition hover:text-indigo-600 hover:underline dark:text-violet-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="group relative">
                  <ShieldCheck
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-violet-500"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    minLength={6}
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-violet-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-600"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                  Minimum 6 characters.
                </p>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between py-0.5">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded accent-violet-600"
                  />
                  Remember me
                </label>

                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Secure access
                </span>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in to your account"}

                {!loading && (
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            {/* Sign up */}
            <div className="mt-4 text-center text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/sign-up"
                className="font-bold text-violet-600 transition hover:text-indigo-600 hover:underline dark:text-violet-400"
              >
                Create account
              </Link>
            </div>

            {/* Security footer */}
            <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-400 dark:border-slate-700">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Secure workforce access · ShiftSync
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
