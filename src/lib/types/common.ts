export type WithClassName<T = unknown> = T & { className?: string };

export interface NavLink {
  href: string;
  label: string;
}
