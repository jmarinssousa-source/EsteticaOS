"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { hasPermission, type ClinicRole, type Permissions } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OrbyniqBadge } from "@/components/layout/OrbyniqBadge";

const COLLAPSE_STORAGE_KEY = "esteticaos:sidebar-collapsed";
const COLLAPSE_CHANGE_EVENT = "esteticaos:sidebar-collapsed-change";

function subscribe(callback: () => void) {
  window.addEventListener(COLLAPSE_CHANGE_EVENT, callback);
  return () => window.removeEventListener(COLLAPSE_CHANGE_EVENT, callback);
}

function getSnapshot() {
  return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

export function Sidebar({
  clinicName,
  role,
  permissions,
}: {
  clinicName: string;
  role: ClinicRole;
  permissions: Partial<Permissions>;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleCollapsed() {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(!collapsed));
    window.dispatchEvent(new Event(COLLAPSE_CHANGE_EVENT));
  }

  const items = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission({ role, permissions }, item.permission),
  );

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r bg-sidebar md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b px-3">
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight">{clinicName}</p>
            <p className="text-[11px] text-muted-foreground">EstéticaOS</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className={collapsed ? "mx-auto" : "shrink-0"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const linkClassName = cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            collapsed && "justify-center px-2",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          );

          if (!collapsed) {
            return (
              <Link key={item.href} href={item.href} className={linkClassName}>
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          }

          // The <Link> stays the real anchor here — the tooltip only wraps an
          // inert <span> inside it, so navigation never depends on Base UI's
          // render-prop merge preserving href/onClick on a cloned element.
          return (
            <Tooltip key={item.href}>
              <Link href={item.href} className={linkClassName}>
                <TooltipTrigger render={<span className="inline-flex" />}>
                  <item.icon className="size-4 shrink-0" />
                </TooltipTrigger>
              </Link>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="border-t p-3">
          <OrbyniqBadge />
        </div>
      )}
    </aside>
  );
}
