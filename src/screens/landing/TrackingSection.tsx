import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VIOLET = "#6b5ce7";
const GREEN = "#2fc35b";
const BLUE = "#3b82f6";

const CARD = "rounded-3xl bg-white p-5 text-text-primary";
const LABEL = "text-sm type-meta text-text-secondary";
const TITLE = "text-base type-button";
const BODY = "text-sm type-meta text-text-secondary";

function Ring({
  pct,
  size,
  stroke,
  color,
  dashed,
  children,
}: {
  pct: number;
  size: number;
  stroke: number;
  color: string;
  dashed?: boolean;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const common = { cx: size / 2, cy: size / 2, r, fill: "none", strokeWidth: stroke };
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle {...common} stroke="currentColor" className="text-navy-50" />
        <circle
          {...common}
          stroke={color}
          strokeLinecap={dashed ? "butt" : "round"}
          strokeDasharray={dashed ? `${stroke * 0.8} ${stroke * 0.6}` : c}
          strokeDashoffset={dashed ? 0 : c * (1 - pct / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function Segments({
  filled,
  total = 20,
  color,
}: {
  filled: number;
  total?: number;
  color: string;
}) {
  return (
    <div className="flex gap-0.5 rounded-xl bg-white p-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-5 flex-1 rounded-sm"
          style={{ background: i < filled ? color : "var(--color-navy-50)" }}
        />
      ))}
    </div>
  );
}

const CAL_DAYS = [29, 30, ...Array.from({ length: 19 }, (_, i) => i + 1)];

const MEALS = [
  { label: "Breakfast", value: "289 · 24%", color: "var(--color-accent-graphic)", w: 24 },
  { label: "Lunch", value: "444 · 37%", color: "#0f9f98", w: 37 },
  { label: "Dinner", value: "461 · 39%", color: "var(--color-brand-navy)", w: 39 },
];

const LOGGED = [
  {
    tag: "Breakfast",
    tagClass: "bg-text-primary",
    text: "Chick-fil-A breakfast breakfast sandwich hack",
  },
  { tag: "Lunch", tagClass: "bg-accent", text: "a logged meal" },
  { tag: "Dinner", tagClass: "bg-text-primary", text: "incomplete" },
];

export function TrackingSection() {
  return (
    <section
      id="tracking"
      className="rounded-t-[3rem] bg-gradient-to-b from-[#1b3a6b] via-[#1d5a86] to-teal-500 pb-24 pt-14 text-white md:rounded-t-[4rem] md:pt-24"
    >
      <div className="mx-auto w-full max-w-[1272px] px-2 md:px-8 xl:w-[84vw] xl:max-w-[2000px] xl:px-0">
        <h2 className="mx-auto max-w-2xl px-3 text-center text-[34px] md:px-0 type-body leading-[1.15] tracking-tight md:text-[52px]">
          <strong className="type-display">ForkThis!</strong> keeps you on track, all in one place.
        </h2>
        <div className="mt-10 grid gap-3 rounded-[2rem] bg-white/70 p-2 md:mt-14 md:grid-cols-12 md:p-3">
          <div className={cn(CARD, "md:col-span-6")}>
            <p className={LABEL}>Today&apos;s food</p>
            <p className="mt-1 text-3xl type-display">1,486 kcal</p>
            <div className="mt-4 flex items-start justify-between gap-1">
              {[
                { v: "104g", l: "Protein", pct: 70, color: "var(--color-accent)" },
                { v: "141g", l: "Carbs", pct: 60, color: GREEN },
                { v: "47g", l: "Fat", pct: 45, color: VIOLET },
              ].map((m) => (
                <div key={m.l} className="flex flex-col items-center gap-1">
                  <Ring pct={m.pct} size={72} stroke={8} color={m.color}>
                    <span className="text-xs type-button">{m.v}</span>
                  </Ring>
                  <span className="text-[9px] uppercase tracking-wider text-text-neutral-400">
                    {m.l}
                  </span>
                </div>
              ))}
              <Ring pct={82} size={72} stroke={6} color={VIOLET} dashed>
                <span className="text-xl type-display">82</span>
                <span className="text-[9px] text-text-neutral-400">balanced</span>
              </Ring>
            </div>
            <h3 className={cn(TITLE, "mt-4")}>Protein &amp; macro tracker</h3>
            <p className={cn(BODY, "mt-1")}>
              Log meals by photo, barcode, or search and see protein, carbs, and fat fill up as you
              go.
            </p>
          </div>

          <div
            className={cn(CARD, "flex items-center gap-5 md:flex-col md:items-start md:col-span-3")}
          >
            <Ring pct={56} size={140} stroke={18} color={VIOLET}>
              <span className="text-3xl type-display" style={{ color: VIOLET }}>
                56%
              </span>
            </Ring>
            <div>
              <h3 className={TITLE}>calorie goal for today</h3>
              <p className={cn(BODY, "mt-2")}>
                Estimate the energy you burn each day and see how your intake balances out over
                time.
              </p>
            </div>
          </div>

          <div
            className={cn(CARD, "flex items-center gap-5 md:flex-col md:items-start md:col-span-3")}
          >
            <div className="shrink-0 text-center">
              <p className="text-2xl type-display">1,450 ml</p>
              <p className="text-xs" style={{ color: BLUE }}>
                73% complete
              </p>
              <div className="mt-3">
                <Ring pct={73} size={110} stroke={14} color={BLUE} dashed>
                  <span className="flex size-10 items-center justify-center rounded-full bg-white text-lg shadow-card">
                    +
                  </span>
                </Ring>
              </div>
            </div>
            <div>
              <h3 className={TITLE}>Water intake</h3>
              <p className={cn(BODY, "mt-2")}>
                Staying hydrated supports healthy weight loss by helping your body function
                efficiently, manage hunger cues, and perform at its best.
              </p>
            </div>
          </div>

          <div className={cn(CARD, "md:col-span-3")}>
            <p className={LABEL}>Fri</p>
            <p className="text-3xl type-body">Oct 10</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-accent">Next dose</p>
            <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-xs">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i} className="pb-1 text-[10px] text-text-neutral-400">
                  {d}
                </span>
              ))}
              {CAL_DAYS.map((d, i) => (
                <span
                  key={i}
                  className={cn(
                    "mx-auto flex h-8 w-9 items-center justify-center rounded-full",
                    i < 2 && "bg-navy-100 text-text-neutral-500",
                    d === 10 && i >= 2 && "bg-accent-soft text-accent-ink type-button",
                  )}
                >
                  {d}
                </span>
              ))}
            </div>
            <h3 className={cn(TITLE, "mt-4")}>Medication tracker</h3>
            <p className={cn(BODY, "mt-1")}>
              GLP-1 and Peptide calendars with reminders, so you don&apos;t forget your next dose!
            </p>
          </div>

          <div
            className={cn(CARD, "flex items-center gap-5 md:flex-col md:items-start md:col-span-3")}
          >
            <Ring pct={72} size={120} stroke={14} color="var(--color-accent)">
              <span className="text-3xl type-display">
                72<span className="text-lg">%</span>
              </span>
            </Ring>
            <div>
              <h3 className={TITLE}>Movement goals</h3>
              <p className="mt-1 text-xs type-meta text-text-secondary">
                Set a goal and track your daily progress.
              </p>
              <div className="mt-3 flex gap-5 text-xs text-text-neutral-500">
                <div>
                  Duration
                  <p className="text-base type-button text-accent">36m</p>
                </div>
                <div>
                  Energy
                  <p className="text-base type-button text-accent">312 kcal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-b from-[#0ecf47] via-[#5fdc8b] to-[#e3f8ea] p-5 text-white md:col-span-3">
            <p className="text-sm type-meta">Body mass index</p>
            <p className="mt-2 text-5xl type-display">24.1</p>
            <p className="mt-3 text-sm type-meta">Within the healthy range</p>
            <div className="mt-2">
              <Segments filled={14} color="#16c456" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-teal-800">
              <span>−3.2 since start</span>
              <span>Goal 23</span>
            </div>
            <h3 className="mt-4 text-base type-button text-text-primary">BMI calculator</h3>
            <p className="mt-1 text-sm type-meta text-text-secondary">
              Use our BMI calculator as a simple tool to track changes over time, stay accountable,
              and measure progress along the way.
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-b from-[#ff7a00] via-[#ffa34d] to-[#fde5cf] p-5 text-white md:col-span-3">
            <p className="text-sm type-meta">Daily energy expenditure</p>
            <p className="mt-2 text-5xl type-display">2,240</p>
            <p className="mt-3 text-sm type-meta">Estimated calories per day</p>
            <div className="mt-2">
              <Segments filled={14} color="#a8742f" />
            </div>
            <h3 className="mt-6 text-base type-button text-text-primary">TDEE calculator</h3>
            <p className="mt-1 text-sm type-meta text-text-secondary">
              A TDEE calculator estimates your Total Daily Energy Expenditure — the approximate
              number of calories your body burns each day based on factors like your age, height,
              weight, sex, and activity level.
            </p>
          </div>

          <div className={cn(CARD, "md:col-span-7")}>
            <p className={LABEL}>Calories by meal</p>
            <p className="mt-2 text-4xl type-display">
              1,194 <span className="text-xs type-meta text-text-neutral-500">kcal avg/day</span>
            </p>
            <div className="mt-3 flex gap-1" aria-hidden>
              {MEALS.map((m) => (
                <span
                  key={m.label}
                  className="h-7 rounded-md"
                  style={{ width: `${m.w}%`, background: m.color }}
                />
              ))}
            </div>
            <ul className="mt-4 space-y-3 text-sm text-text-secondary">
              {MEALS.map((m) => (
                <li key={m.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-sm" style={{ background: m.color }} />
                    {m.label}
                  </span>
                  <span>{m.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={cn(CARD, "md:col-span-5")}>
            <ul className="space-y-2">
              {LOGGED.map((m) => (
                <li key={m.tag} className="rounded-2xl bg-navy-soft p-3.5">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white",
                      m.tagClass,
                    )}
                  >
                    {m.tag}
                  </span>
                  <p className="mt-2 text-sm type-item-title">{m.text}</p>
                </li>
              ))}
            </ul>
            <h3 className={cn(TITLE, "mt-5 text-lg")}>Breakfast, lunch, dinner tracker</h3>
            <p className={cn(BODY, "mt-1")}>2 of 3 meals logged · Dinner incomplete</p>
          </div>
        </div>
      </div>
    </section>
  );
}
