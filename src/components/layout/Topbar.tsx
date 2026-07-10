import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "@/components/layout/MobileNav";
import { HelpButton } from "@/components/help/HelpButton";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";
import { ROLE_LABELS, type ClinicRole, type Permissions } from "@/lib/auth/permissions";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar({
  clinicName,
  fullName,
  role,
  permissions,
}: {
  clinicName: string;
  fullName: string;
  role: ClinicRole;
  permissions: Partial<Permissions>;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav role={role} permissions={permissions} />
        <div className="flex flex-col md:hidden">
          <span className="text-sm font-semibold leading-tight">{clinicName}</span>
          <span className="text-[10px] leading-tight text-muted-foreground">EstéticaOS</span>
        </div>
        <span className="hidden text-sm font-medium text-foreground md:inline">{clinicName}</span>
      </div>

      <div className="flex items-center gap-1">
        <HelpButton />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="flex items-center gap-2 px-2" />}>
            <Avatar className="size-8">
              <AvatarFallback>{initials(fullName) || "?"}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{fullName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{fullName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {ROLE_LABELS[role]}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <OrbyniqBadge />
            </div>
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem
                render={<button type="submit" className="flex w-full items-center gap-2" />}
              >
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
