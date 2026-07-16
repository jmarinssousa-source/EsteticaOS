import type { PermissionKey } from "@/lib/auth/permissions";
import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  Home,
  Kanban,
  LineChart,
  Package,
  Settings,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  permission?: PermissionKey;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/hoje", label: "Hoje", icon: Home },
  { href: "/crm", label: "CRM", icon: Kanban, permission: "crm_view" },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, permission: "agenda_view" },
  { href: "/pacientes", label: "Pacientes", icon: Users, permission: "patients_view" },
  { href: "/orcamentos", label: "Orçamentos", icon: ClipboardList, permission: "budgets_view" },
  { href: "/sessoes", label: "Sessões", icon: Wrench, permission: "sessions_view" },
  { href: "/financeiro", label: "Financeiro", icon: Wallet, permission: "finance_view" },
  { href: "/estoque", label: "Estoque", icon: Package, permission: "inventory_view" },
  { href: "/relatorios", label: "Relatórios", icon: LineChart, permission: "reports_view" },
  { href: "/plano", label: "Plano", icon: CreditCard, permission: "settings_access" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, permission: "settings_access" },
];
