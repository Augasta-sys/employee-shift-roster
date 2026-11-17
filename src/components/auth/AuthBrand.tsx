import { CalendarDays, Clock3, Users } from "lucide-react";

export default function AuthBrand() {
  return (
    <div
  className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] bg-cover bg-center p-8 text-white sm:p-10 lg:p-12"
  style={{
    backgroundImage: `
      linear-gradient(
        135deg,
        rgba(23, 26, 59, 0.94),
        rgba(49, 46, 129, 0.78)
      ),
      url("https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1400&q=85")
    `,
  }}
>
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-500/30 blur-[80px]" />
      <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-cyan-400/20 blur-[80px]" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg">
          <CalendarDays size={23} />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight">ShiftSync</h1>
          <p className="text-[10px] tracking-[2px] text-indigo-200">
            WORKFORCE MANAGEMENT
          </p>
        </div>
      </div>

      <div className="relative z-10 my-10 max-w-lg">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-indigo-100">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Smarter scheduling starts here
        </div>

        <h2 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
          Your team.
          <br />
          Your time.
          <br />
          <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
            Perfectly aligned.
          </span>
        </h2>

        <p className="mt-6 max-w-md text-sm leading-7 text-indigo-100/70 sm:text-base">
          Simplify employee scheduling, automate shift rotations and keep
          your entire workforce connected.
        </p>

        <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
          {[
            { icon: Users, label: "Team management" },
            { icon: Clock3, label: "Smart shifts" },
            { icon: CalendarDays, label: "Live rosters" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/15"
            >
              <Icon size={21} className="mb-3 text-cyan-300" />
              <p className="text-[10px] leading-4 text-indigo-100 sm:text-xs">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-indigo-200/60">
        <span>© 2026 ShiftSync</span>
        <span>Work smarter, together.</span>
      </div>
    </div>
  );
}
