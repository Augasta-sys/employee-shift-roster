import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Mail,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);


const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError("");

  const normalizedEmail = email.trim().toLowerCase();

  const emailRegex =
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!emailRegex.test(normalizedEmail)) {
    setError("Please enter a valid email address.");
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

    navigate("/reset-password", {
      state: { email: normalizedEmail },
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    setError("Unable to process your request. Please try again.");
  } finally {
    setLoading(false);
  }
};

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

      {/* Background overlay */}
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
        {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
      </button>

      {/* Main layout */}
      <div className="relative z-10 mx-auto grid h-full w-full max-w-[1900px] grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">

        {/* LEFT SECTION */}
        <section className="relative hidden h-full min-h-0 overflow-hidden px-7 py-5 text-white md:block lg:px-10 lg:py-6 xl:px-16">

          <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">

            {/* Branding */}
            <div className="flex items-center gap-3">
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

            {/* Hero */}
            <div className="flex min-h-0 flex-col justify-center">

              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-semibold text-blue-100 backdrop-blur-xl">
                <Sparkles size={14} className="text-amber-300" />
                We're here to help
              </div>

              <h2 className="text-[clamp(2rem,3.4vw,3.6rem)] font-bold leading-[1.13] tracking-tight">
                Your Workday.
                <br />
                Your Schedule.
                <br />
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Your Access.
                </span>
              </h2>

              <p className="mt-4 max-w-lg text-xs leading-6 text-blue-100/75 lg:text-sm lg:leading-7">
                Forgot your password? Don't worry. Follow the
                account recovery process to get back to managing
                your workforce.
              </p>

              {/* Security card */}
              <div className="mt-6 max-w-[480px] rounded-2xl border border-white/20 bg-white/[0.10] p-5 shadow-xl backdrop-blur-xl">

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/25 text-violet-200">
                    <ShieldCheck size={23} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold">
                      Account protection
                    </h3>

                    <p className="mt-1 text-[10px] text-blue-100/60">
                      Your account security matters to us.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-blue-100/75">
                    <CheckCircle2 size={15} className="text-emerald-300" />
                    Secure account access
                  </div>

                  <div className="flex items-center gap-2 text-xs text-blue-100/75">
                    <CheckCircle2 size={15} className="text-emerald-300" />
                    Simple recovery process
                  </div>

                  <div className="flex items-center gap-2 text-xs text-blue-100/75">
                    <CheckCircle2 size={15} className="text-emerald-300" />
                    Workforce data protection
                  </div>
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
        <section className="relative flex h-full min-h-0 items-center justify-center overflow-hidden px-4 py-3 sm:px-8 md:px-5 lg:px-10 xl:px-16">

          {/* Mobile logo */}
          <div className="absolute left-5 top-4 flex items-center gap-2 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500 text-white">
              <CalendarDays size={19} />
            </div>

            <span className="text-lg font-bold text-white">
              Shift<span className="text-violet-300">Sync</span>
            </span>
          </div>

          {/* Forgot password card */}
          <div className="my-auto w-full max-w-[430px] rounded-[24px] border border-white/40 bg-white/[0.97] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:p-7 lg:p-8 dark:border-slate-700/60 dark:bg-[#111827]/95">

            {/* Card header */}
            <div className="mb-6 text-center">

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                <Mail size={24} />
              </div>

              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[2px] text-violet-600 dark:text-violet-400">
                Account recovery
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[27px] dark:text-white">
                Forgot password?
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm dark:text-slate-400">
                Enter your registered email address to continue
                with account recovery.
              </p>
            </div>

            {/* Success message */}
            {success ? (
              <div className="py-3 text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <CheckCircle2 size={28} />
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Request submitted
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Your request has been processed in the demo
                  application. A real password reset link requires
                  a configured email service.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="mt-5 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
                >
                  Try another email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Registered email address
                  </label>

                  <div className="group relative">
                    <Mail
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-violet-500"
                    />

                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value.toLowerCase())
                      }
                      placeholder="name@company.com"
                      autoComplete="email"
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-violet-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                    Enter the email associated with your account.
                  </p>
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
                  className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Processing..." : "Continue"}

                  {!loading && (
                    <ArrowRight
                      size={18}
                      className="transition group-hover:translate-x-1"
                    />
                  )}
                </button>
              </form>
            )}

            {/* Back to login */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-center dark:border-slate-700">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 transition hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400"
              >
                <ArrowLeft size={15} />
                Back to sign in
              </Link>
            </div>

            {/* Security footer */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              Secure workforce access · ShiftSync
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
