import { MobileNav } from "@/components/layout/MobileNav";
import { LogoMark } from "@/components/brand/Logo";
import { HelpButton } from "@/components/help/HelpButton";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { type ClinicRole, type Permissions } from "@/lib/auth/permissions";

export function Topbar({
  clinicName,
  fullName,
  email,
  role,
  permissions,
  showNav = true,
}: {
  clinicName: string;
  fullName: string;
  email: string;
  role: ClinicRole;
  permissions: Partial<Permissions>;
  /** Falso quando o plano está bloqueado: sem menu, porque todo item
   *  levaria a uma tela barrada. O menu da conta continua, para dar
   *  saída pelo "Sair". */
  showNav?: boolean;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        {showNav && <MobileNav role={role} permissions={permissions} />}
        <div className="flex items-center gap-2 md:hidden">
          <LogoMark className="size-7" />
          <div className="flex flex-col">
            <span className="font-heading text-sm font-semibold leading-tight">{clinicName}</span>
            <span className="text-[9px] uppercase tracking-widest leading-tight text-muted-foreground">
              Estética<span className="text-primary">OS</span>
            </span>
          </div>
        </div>
        <span className="hidden font-heading text-sm font-medium text-foreground md:inline">
          {clinicName}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <HelpButton />
        <AccountMenu fullName={fullName} email={email} role={role} />
      </div>
    </header>
  );
}
