import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 0%, oklch(0.93 0.03 150 / 55%), transparent), radial-gradient(40% 40% at 100% 100%, oklch(0.82 0.09 85 / 30%), transparent)",
        }}
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="mb-8" aria-label="Ir para a página inicial">
        <Logo markClassName="size-9" wordmarkClassName="text-2xl" />
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <div className="mt-8">
        <OrbyniqBadge className="items-center text-center" />
      </div>
    </div>
  );
}
