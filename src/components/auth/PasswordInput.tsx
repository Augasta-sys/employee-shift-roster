import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Enter your password",
  id = "password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
<input
  id={id}
  type={showPassword ? "text" : "password"}
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  autoComplete="current-password"
  required
  minLength={6}
  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
/>
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-500"
      >
        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
