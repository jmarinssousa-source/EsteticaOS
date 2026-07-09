export const CLINIC_ROLES = [
  "owner",
  "manager",
  "reception",
  "professional",
  "finance",
] as const;

export type ClinicRole = (typeof CLINIC_ROLES)[number];

export const ROLE_LABELS: Record<ClinicRole, string> = {
  owner: "Dono/Admin",
  manager: "Gerente",
  reception: "Recepção/Comercial",
  professional: "Profissional",
  finance: "Financeiro",
};

export const PERMISSION_KEYS = [
  "crm_view",
  "crm_edit",
  "patients_view",
  "patients_edit",
  "records_view",
  "records_edit",
  "agenda_view",
  "agenda_edit",
  "budgets_view",
  "budgets_edit",
  "sessions_view",
  "sessions_edit",
  "finance_view",
  "finance_revenue_view",
  "finance_expense_view",
  "finance_commissions_view",
  "finance_edit",
  "inventory_view",
  "inventory_edit",
  "reports_view",
  "settings_access",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type Permissions = Record<PermissionKey, boolean>;

export const PERMISSION_GROUPS: { label: string; keys: PermissionKey[] }[] = [
  { label: "CRM", keys: ["crm_view", "crm_edit"] },
  { label: "Pacientes", keys: ["patients_view", "patients_edit"] },
  { label: "Prontuário", keys: ["records_view", "records_edit"] },
  { label: "Agenda", keys: ["agenda_view", "agenda_edit"] },
  { label: "Orçamentos", keys: ["budgets_view", "budgets_edit"] },
  { label: "Sessões", keys: ["sessions_view", "sessions_edit"] },
  {
    label: "Financeiro",
    keys: [
      "finance_view",
      "finance_revenue_view",
      "finance_expense_view",
      "finance_commissions_view",
      "finance_edit",
    ],
  },
  { label: "Estoque", keys: ["inventory_view", "inventory_edit"] },
  { label: "Relatórios", keys: ["reports_view"] },
  { label: "Configurações", keys: ["settings_access"] },
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  crm_view: "Ver CRM",
  crm_edit: "Editar CRM",
  patients_view: "Ver pacientes",
  patients_edit: "Editar pacientes",
  records_view: "Ver prontuário",
  records_edit: "Editar prontuário",
  agenda_view: "Ver agenda",
  agenda_edit: "Editar agenda",
  budgets_view: "Ver orçamento",
  budgets_edit: "Editar orçamento",
  sessions_view: "Ver sessões",
  sessions_edit: "Editar sessões",
  finance_view: "Ver financeiro",
  finance_revenue_view: "Ver receitas",
  finance_expense_view: "Ver despesas",
  finance_commissions_view: "Ver comissões",
  finance_edit: "Editar financeiro",
  inventory_view: "Ver estoque",
  inventory_edit: "Editar estoque",
  reports_view: "Ver relatórios",
  settings_access: "Acessar configurações",
};

const ALL_TRUE = Object.fromEntries(
  PERMISSION_KEYS.map((key) => [key, true]),
) as Permissions;

const ALL_FALSE = Object.fromEntries(
  PERMISSION_KEYS.map((key) => [key, false]),
) as Permissions;

/** Default permissions granted to a role when a member is created. The
 * owner/admin always has full access regardless of this table — see
 * hasPermission(). Admins can override any of these per user afterwards. */
export const DEFAULT_PERMISSIONS: Record<ClinicRole, Permissions> = {
  owner: ALL_TRUE,
  manager: ALL_TRUE,
  reception: {
    ...ALL_FALSE,
    crm_view: true,
    crm_edit: true,
    patients_view: true,
    patients_edit: true,
    records_view: true,
    agenda_view: true,
    agenda_edit: true,
    budgets_view: true,
    budgets_edit: true,
    sessions_view: true,
    inventory_view: true,
  },
  professional: {
    ...ALL_FALSE,
    patients_view: true,
    records_view: true,
    records_edit: true,
    agenda_view: true,
    sessions_view: true,
    sessions_edit: true,
  },
  finance: {
    ...ALL_FALSE,
    patients_view: true,
    agenda_view: true,
    budgets_view: true,
    sessions_view: true,
    finance_view: true,
    finance_revenue_view: true,
    finance_expense_view: true,
    finance_commissions_view: true,
    finance_edit: true,
    reports_view: true,
  },
};

export function hasPermission(
  member: { role: ClinicRole; permissions: Partial<Permissions> } | null,
  key: PermissionKey,
): boolean {
  if (!member) return false;
  if (member.role === "owner") return true;
  return member.permissions[key] ?? DEFAULT_PERMISSIONS[member.role][key];
}
