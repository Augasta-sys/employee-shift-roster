import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Home,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const NotFoundPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === "dark";

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(user ? "/dashboard" : "/login");
    }
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#111936]">

      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=2000&q=90')",
        }}
      />

      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#10183e]/85 via-[#18245b]/80 to-[#352078]/75" />

      {/* Background highlights */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[350px] w-[350px] rounded-full bg-blue-500/15 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[350px] w-[350px] rounded-full bg-violet-500/15 blur-[110px]" />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl items-center justify-center overflow-y-auto px-3 py-3 sm:px-5 md:overflow-hidden md:py-4">

       <div
  className={`w-full max-w-[650px] max-h-full overflow-y-auto rounded-3xl border px-4 py-5 text-center shadow-2xl backdrop-blur-xl transition-colors duration-300 sm:px-8 sm:py-7 md:overflow-hidden lg:px-10 lg:py-8 ${
    isDark
      ? "border-slate-700/70 bg-[#111827]/95 text-white shadow-black/30"
      : "border-white/50 bg-white/[0.96] text-slate-900 shadow-black/25"
  }`}
>
          {/* Brand */}
          <div className="mb-3 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg">
              <CalendarDays size={24} />
            </div>

            <span
              className={`text-2xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              ShiftSync
            </span>
          </div>

         
{/* 404 illustration */}
<div className="relative mx-auto mb-2 flex h-24 w-full items-center justify-center sm:h-28 md:h-32">

  {/* Background glow */}
  <div className="absolute h-28 w-28 rounded-full bg-blue-500/10 blur-2xl sm:h-36 sm:w-36" />

  {/* 404 number */}
  <h1 className="relative z-10 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 bg-clip-text text-[80px] font-black leading-none tracking-tighter text-transparent sm:text-[100px] md:text-[110px]">
    404
  </h1>
</div>

          {/* Error icon */}
          <div className="mb-2 flex justify-center">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                isDark
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <AlertTriangle size={25} />
            </div>
          </div>

          {/* Error message */}
          <h2
            className={`text-2xl font-bold tracking-tight sm:text-3xl ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Oops! Page Not Found
          </h2>

          <p
            className={`mx-auto mt-2 max-w-md text-sm leading-7 sm:text-base ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            The page you're looking for doesn't exist, may have been moved,
            or the URL might be incorrect. Let's get you back on track.
          </p>

          {/* Buttons */}
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleGoBack}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold transition ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <ArrowLeft size={17} />
              Go Back
            </button>

            <Link
              to={user ? "/dashboard" : "/login"}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700 hover:to-violet-700"
            >
              <Home size={17} />
              Back to {user ? "Dashboard" : "Login"}
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* Help text */}
          <div
            className={`mt-5 border-t pt-3 text-xs ${
              isDark
                ? "border-slate-700 text-slate-500"
                : "border-slate-200 text-slate-400"
            }`}
          >
            <p>
              Need assistance? Contact your system administrator.
            </p>

            <p className="mt-2">
              © {new Date().getFullYear()} ShiftSync. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
