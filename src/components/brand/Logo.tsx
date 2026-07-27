import { cn } from "@/lib/utils";

/**
 * Marca do EstéticaOS: flor de lótus estilizada sobre degradê clay, com
 * brilho champagne. Mesmo desenho de src/app/icon.svg e dos ícones PWA —
 * mudanças aqui devem ser replicadas lá.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("size-7 shrink-0", className)}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c98a63" />
          <stop offset="1" stopColor="#a35a3a" />
        </linearGradient>
        <linearGradient id="logo-petal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf4" />
          <stop offset="1" stopColor="#f7e8dc" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-bg)" />
      <path
        d="M16 25.5 C 11.5 19.5, 12 13.5, 16 9 C 20 13.5, 20.5 19.5, 16 25.5 Z"
        fill="url(#logo-petal)"
        opacity="0.55"
        transform="rotate(-42 16 25.5)"
      />
      <path
        d="M16 25.5 C 11.5 19.5, 12 13.5, 16 9 C 20 13.5, 20.5 19.5, 16 25.5 Z"
        fill="url(#logo-petal)"
        opacity="0.55"
        transform="rotate(42 16 25.5)"
      />
      <path
        d="M16 25.5 C 11.5 19.5, 12 13.5, 16 9 C 20 13.5, 20.5 19.5, 16 25.5 Z"
        fill="url(#logo-petal)"
      />
      <path
        d="M24.6 4.6 C 25 6.6, 25.9 7.5, 27.9 7.9 C 25.9 8.3, 25 9.2, 24.6 11.2 C 24.2 9.2, 23.3 8.3, 21.3 7.9 C 23.3 7.5, 24.2 6.6, 24.6 4.6 Z"
        fill="#f2d09b"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading font-semibold tracking-tight", className)}>
      Estética<span className="text-primary">OS</span>
    </span>
  );
}

export function Logo({
  markClassName,
  wordmarkClassName,
  className,
}: {
  markClassName?: string;
  wordmarkClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <Wordmark className={cn("text-xl", wordmarkClassName)} />
    </span>
  );
}
