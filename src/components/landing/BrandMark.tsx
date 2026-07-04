export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sb-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.68 0.19 290)" />
          <stop offset="100%" stopColor="oklch(0.56 0.22 285)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#sb-brand)" />
      <path
        d="M13 24 L20 12 L27 24 Z"
        fill="white"
        opacity="0.95"
      />
      <circle cx="20" cy="25" r="2.6" fill="oklch(0.56 0.22 285)" />
    </svg>
  );
}
