/**
 * A person seated at a desk — the "Sedentary" option. Lucide has no such
 * figure, so this is drawn to the same 24px / 2px-stroke grid as RunnerIcon.
 */
export function DeskIcon({ size = 24, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* head */}
      <circle cx="7" cy="5" r="2" />
      {/* back, then forearm reaching to the desk */}
      <path d="M7 8.5v4.5" />
      <path d="M7 10.5h6" />
      {/* seat and lower legs */}
      <path d="M7 13h5v6" />
      {/* desk top and leg */}
      <path d="M13 10.5h8" />
      <path d="M19 10.5V20" />
      {/* chair base */}
      <path d="M7 13v7" />
    </svg>
  );
}
