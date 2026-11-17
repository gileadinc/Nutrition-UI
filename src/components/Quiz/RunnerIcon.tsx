/**
 * A running figure — the "Very active" option. Lucide has no runner, so this is
 * drawn to its 24px / 2px-stroke grid to sit beside the other option icons.
 */
export function RunnerIcon({ size = 24, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
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
      <circle cx="16" cy="4" r="2" />
      {/* torso, driving forward */}
      <path d="M14.5 9.5 11 12l2 3" />
      {/* leading arm */}
      <path d="M14.5 9.5 19 11" />
      {/* trailing arm, bent back */}
      <path d="M12.6 10.1 9 9l-2 2.5" />
      {/* front thigh and shin */}
      <path d="m13 15 1 4-3 3" />
      {/* back leg, pushing off */}
      <path d="m13 15-4 1-2.5 4" />
    </svg>
  );
}
