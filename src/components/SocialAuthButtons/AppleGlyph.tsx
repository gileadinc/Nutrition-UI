/** The Apple mark, sized to sit beside GoogleGlyph in the social auth row. */
export function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.05 12.54c-.03-2.72 2.22-4.03 2.32-4.09-1.27-1.85-3.24-2.11-3.94-2.14-1.68-.17-3.28 1-4.13 1-.85 0-2.16-.98-3.55-.95-1.83.03-3.51 1.06-4.45 2.7-1.9 3.29-.49 8.16 1.36 10.83.9 1.31 1.98 2.78 3.39 2.73 1.36-.06 1.88-.88 3.52-.88 1.64 0 2.11.88 3.55.85 1.47-.02 2.4-1.33 3.3-2.65 1.04-1.52 1.47-2.99 1.49-3.07-.03-.01-2.86-1.1-2.89-4.35zM14.3 4.5c.75-.91 1.25-2.17 1.11-3.43-1.08.04-2.38.72-3.15 1.62-.69.8-1.3 2.08-1.14 3.31 1.2.09 2.43-.61 3.18-1.5z" />
    </svg>
  );
}
