
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserRound,
  ShieldCheck,
  Moon,
  Sun,
  UsersRound,
  Clock3,
  Sparkles,
} from "lucide-react";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const features = [
    { icon: CalendarDays, title: "Smart Scheduling" },
    { icon: UsersRound, title: "Team Management" },
    { icon: Clock3, title: "Shift Rotation" },
  ];

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    const emailRegex =
      /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (
      !normalizedName ||
      !normalizedEmail ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (normalizedName.length < 3) {
      setError("Name must contain at least 3 characters.");
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

    if (!agreeTerms) {
      setError("Please accept the terms and conditions.");
      return;
    }

    try {
      setLoading(true);

      const existingUsers = await api.get("/users", {
        params: { email: normalizedEmail },
      });

      if (existingUsers.data.length > 0) {
        setError("An account with this email already exists.");
        return;
      }

      await api.post("/users", {
        name: normalizedName,
        email: normalizedEmail,
        password,
        role: "employee",
        employeeId: `EMP${Date.now()}`,
      });

      navigate("/login", {
        replace: true,
        state: {
          message: "Account created successfully. Please sign in.",
        },
      });
    } catch (err) {
      console.error("Registration error:", err);
      setError("Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#090d24]">

      <style>{`
        .signup-left-layout {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) auto;
          height: 100%;
          min-height: 0;
          gap: 10px;
        }

        .signup-hero {
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        @media (min-width: 768px) and (max-height: 700px) {
          .signup-left-layout {
            gap: 5px;
          }

          .signup-hero .signup-heading {
            font-size: clamp(28px, 3vw, 38px);
          }

          .signup-hero .signup-description {
            margin-top: 9px;
            font-size: 12px;
          }

          .signup-hero .signup-feature-card {
            margin-top: 12px;
            padding: 11px;
          }
        }

        @media (min-width: 768px) and (max-height: 560px) {
          .signup-hero .signup-feature-card {
            display: none;
          }

          .signup-hero .signup-badge {
            margin-bottom: 8px;
          }
        }

        @media (max-height: 620px) {
          .signup-card {
            padding: 14px !important;
          }

          .signup-card-header {
            margin-bottom: 10px !important;
          }

          .signup-form {
            gap: 8px !important;
          }

          .signup-field-input {
            height: 36px !important;
          }

          .signup-card-footer {
            margin-top: 9px !important;
            padding-top: 8px !important;
          }
        }

        @media (max-height: 540px) {
          .signup-card-header-icon {
            display: none !important;
          }

          .signup-card-header {
            margin-bottom: 7px !important;
          }

          .signup-card-footer {
            display: none !important;
          }
        }
      `}</style>

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

        {/* LEFT BRANDING SECTION */}
        <section className="relative hidden h-full min-h-0 overflow-hidden px-7 py-5 text-white md:block lg:px-10 lg:py-6 xl:px-16">

          <div className="signup-left-layout">

            {/* Logo */}
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
            <div className="signup-hero relative z-10">

              <div className="signup-badge mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-semibold text-blue-100 backdrop-blur-xl">
                <Sparkles size={14} className="text-amber-300" />
                Your workforce journey starts here
              </div>

              <h2 className="signup-heading text-[clamp(2rem,3.4vw,3.6rem)] font-bold leading-[1.13] tracking-tight">
                Build Better
                <br />
                Workdays.
                <br />
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  Grow Together.
                </span>
              </h2>

              <p className="signup-description mt-4 max-w-lg text-xs leading-6 text-blue-100/75 lg:text-sm lg:leading-7">
                Join ShiftSync and experience smarter scheduling,
                seamless team collaboration and organized workdays.
              </p>

              {/* Feature card */}
              <div className="signup-feature-card mt-5 max-w-[520px] rounded-2xl border border-white/20 bg-white/[0.10] p-4 shadow-xl backdrop-blur-xl lg:mt-6 lg:p-5">

                <p className="text-[10px] font-medium text-blue-100/60">
                  WHY SHIFTSYNC?
                </p>

                <h3 className="mt-1 text-base font-bold">
                  Everything in sync.
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {features.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-xl border border-white/15 bg-white/[0.08] p-2.5 transition hover:bg-white/[0.14] lg:p-3"
                      >
                        <Icon
                          size={19}
                          className="mb-2 text-violet-200"
                        />
                        <p className="text-[9px] font-bold lg:text-[10px]">
                          {item.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-white/15 pt-3 text-[10px] text-blue-100/50">
              <span>© 2026 ShiftSync</span>
              <span>Work smarter. Together.</span>
            </div>
          </div>
        </section>

        {/* RIGHT SIGN UP SECTION */}
        <section className="relative flex h-full min-h-0 items-center justify-center overflow-hidden px-4 py-3 sm:px-8 md:px-5 lg:px-10 xl:px-16">

          {/* Sign up card */}
        <div className="signup-card relative my-auto w-full max-w-[430px] min-h-[590px] max-h-[calc(100dvh-16px)] rounded-[22px] border border-white/40 bg-white/[0.97] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:p-6 lg:p-7 dark:border-slate-700/60 dark:bg-[#111827]/95">

            {/* Header */}
            <div className="signup-card-header mb-2 text-center">

              <div className="signup-card-header-icon mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                <UserRound size={22} />
              </div>

              <p className="mb-1 text-[10px] font-bold uppercase tracking-[2px] text-violet-600 dark:text-violet-400">
                Get started
              </p>

              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                Create your account
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Join your workforce on ShiftSync.
              </p>
            </div>

            {/* Registration form */}
           <form onSubmit={handleSignUp} className="signup-form flex flex-col gap-2">

              {/* Full name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Full name
                </label>

                <div className="relative">
                  <UserRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    minLength={3}
                    required
                    className="signup-field-input h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value.toLowerCase())
                    }
                    placeholder="name@company.com"
                    autoComplete="email"
                    required
                    className="signup-field-input h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="signup-field-input h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Minimum 6 characters.
                </p>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <ShieldCheck
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="signup-field-input h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-2 text-[10px] leading-4 text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded accent-violet-600"
                />
                <span>
                  I agree to the terms and conditions and privacy policy.
                </span>
              </label>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-4 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create my account"}

                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            {/* Login link */}
            <div className="mt-2 text-center text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-violet-600 transition hover:text-indigo-600 hover:underline dark:text-violet-400"
              >
                Sign in
              </Link>
            </div>

            {/* Security footer */}
            <div className="signup-card-footer mt-2 flex items-center justify-center gap-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-700">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Secure workforce access · ShiftSync
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
