/**
 * Syringe with a check badge — the GLP-1 option in the design. Lucide has no
 * such icon, so this composes its `syringe` paths with a check circle in the
 * lower-right, drawn to lucide's 24px / 2px-stroke grid.
 */
export function SyringeCheck({ size = 24, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
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
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 11.5 16.5" />
      <path d="M8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
      <path d="m14 4 6 6" />
      <circle cx="17.5" cy="17.5" r="4.5" />
      <path d="m15.6 17.6 1.4 1.4 2.5-2.5" />
    </svg>
  );
}
