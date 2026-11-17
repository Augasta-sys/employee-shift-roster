
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState<string>(
    location.state?.email || ""
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRegex =
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get("/users", {
        params: { email: normalizedEmail },
      });

      if (!response.data.length) {
        setError("No account found with this email address.");
        return;
      }

      const user = response.data[0];

      await api.patch(`/users/${user.id}`, {
        password,
      });

      setSuccess(true);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden overflow-y-auto bg-[#090d24] text-white md:h-dvh md:min-h-0 md:overflow-hidden">

      {/* Background image */}
      <div
        className="fixed inset-0 bg-cover bg-center md:absolute"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=2000&q=90')",
        }}
      />

      {/* Background overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#10183e]/95 via-[#18245b]/90 to-[#352078]/85 md:absolute" />

      {/* Decorative lights */}
      <div className="pointer-events-none fixed -left-40 -top-40 h-80 w-80 rounded-full bg-blue-500/20 blur-[100px] md:absolute" />

      <div className="pointer-events-none fixed -bottom-40 right-0 h-80 w-80 rounded-full bg-violet-500/25 blur-[100px] md:absolute" />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="fixed right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-xl transition hover:bg-white/20 sm:right-6 sm:top-5 md:absolute"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Main layout */}
      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-[2000px] grid-cols-1 lg:h-full lg:min-h-0 lg:grid-cols-[1.05fr_0.95fr]">

        {/* LEFT SECTION */}
        <section className="hidden h-full min-h-0 overflow-hidden px-8 py-5 text-white lg:block xl:px-12 2xl:px-16">

          <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">

            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <CalendarDays
                  size={22}
                  className="text-violet-200"
                />
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  Shift<span className="text-violet-300">Sync</span>
                </h1>

                <p className="text-[9px] tracking-[2px] text-blue-100/65">
                  WORKFORCE MANAGEMENT
                </p>
              </div>
            </div>

            {/* Hero */}
            <div className="flex min-h-0 flex-col justify-center">

              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-blue-100">
                <ShieldCheck
                  size={14}
                  className="text-emerald-300"
                />
                Secure your account
              </div>

              <h2 className="text-[clamp(2rem,3vw,3.3rem)] font-bold leading-[1.12]">
                A Fresh Start.
                <br />
                A Stronger
                <br />
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Password.
                </span>
              </h2>

              <p className="mt-3 max-w-lg text-xs leading-6 text-blue-100/75 xl:text-sm">
                Create a new password to regain access to your
                ShiftSync account and continue managing your
                workforce with confidence.
              </p>

              {/* Security card */}
              <div className="mt-5 max-w-[420px] rounded-2xl border border-white/20 bg-white/[0.10] p-4 backdrop-blur-xl">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/25 text-violet-200">
                    <LockKeyhole size={21} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold">
                      Password protection
                    </h3>

                    <p className="mt-1 text-[10px] text-blue-100/60">
                      Keep your account safe and secure.
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {[
                    "Minimum 6 characters",
                    "Choose a secure password",
                    "Confirm before saving",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-[11px] text-blue-100/75"
                    >
                      <CheckCircle2
                        size={14}
                        className="text-emerald-300"
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/15 pt-3 text-[10px] text-blue-100/50">
              <span>© 2026 ShiftSync</span>
              <span>Work smarter. Together.</span>
            </div>
          </div>
        </section>

        {/* RIGHT SECTION */}
        <section className="relative flex min-h-dvh items-center justify-center px-3 pb-6 pt-20 min-[375px]:px-4 sm:px-6 sm:pt-20 lg:h-full lg:min-h-0 lg:overflow-hidden lg:px-8 lg:py-4 xl:px-12 2xl:px-16">

          {/* Mobile and tablet branding */}
          <div className="absolute left-5 top-5 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500">
              <CalendarDays size={17} />
            </div>

            <span className="text-base font-bold">
              Shift<span className="text-violet-300">Sync</span>
            </span>
          </div>

          {/* Reset password card */}
          <div className="my-auto w-full max-w-[400px] rounded-[20px] border border-white/40 bg-white/[0.97] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl min-[375px]:p-5 sm:max-w-[430px] sm:p-6 lg:max-w-[410px] lg:p-5 xl:p-6 2xl:max-w-[440px] dark:border-slate-700/60 dark:bg-[#111827]/95">

            {!success ? (
              <>
                {/* Back link */}
                <Link
                  to="/forgot-password"
                  className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500 transition hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400"
                >
                  <ArrowLeft size={14} />
                  Back to forgot password
                </Link>

                {/* Heading */}
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                    <LockKeyhole size={21} />
                  </div>

                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[2px] text-violet-600 dark:text-violet-400">
                    Account recovery
                  </p>

                  <h2 className="text-[22px] font-bold text-slate-900 dark:text-white">
                    Reset Password
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Create a new password for your account.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleReset} className="space-y-3">

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Registered email address
                    </label>

                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value.toLowerCase())
                        }
                        placeholder="name@company.com"
                        autoComplete="email"
                        required
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      New password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        aria-label="Toggle password visibility"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-600"
                      >
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>

                    <p className="mt-1 text-[10px] text-slate-400">
                      Minimum 6 characters.
                    </p>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-1 block text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Confirm new password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="confirm-password"
                        type={
                          showConfirmPassword ? "text" : "password"
                        }
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label="Toggle confirm password visibility"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-4 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                    >
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-xs font-semibold text-white shadow-lg shadow-violet-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Updating..." : "Reset Password"}

                    {!loading && (
                      <ArrowRight
                        size={15}
                        className="transition group-hover:translate-x-1"
                      />
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Success message */
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <CheckCircle2 size={28} />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Password Updated!
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Your password has been changed successfully.
                  You can now sign in with your new password.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/login", { replace: true })
                  }
                  className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-xs font-semibold text-white shadow-lg"
                >
                  Continue to Sign In
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 border-t border-slate-100 pt-3 text-center dark:border-slate-700">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600 transition hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400"
              >
                <ArrowLeft size={13} />
                Back to sign in
              </Link>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 text-[9px] text-slate-400">
              <ShieldCheck
                size={13}
                className="text-emerald-500"
              />
              Secure workforce access · ShiftSync
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
