import { hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultStages } from "@/actions/crm";
import { CrmBoard } from "@/components/crm/CrmBoard";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import type { Lead, Stage } from "@/lib/crm/types";

export const metadata = { title: "CRM — EstéticaOS" };

export default async function CrmPage() {
  const member = await requirePermission("crm_view");
  const canEdit = hasPermission(member, "crm_edit");

  await ensureDefaultStages(member.clinicId);

  const supabase = await createClient();

  const [{ data: stages }, { data: leads }, { data: members }, { data: clinic }] = await Promise.all([
    supabase
      .from("crm_stages")
      .select("id, name, position")
      .eq("clinic_id", member.clinicId)
      .order("position", { ascending: true }),
    supabase
      .from("leads")
      .select(
        "id, stage_id, patient_id, name, phone, email, origin, assigned_to, next_action, follow_up_date, potential_value, notes, status, created_at, last_moved_at",
      )
      .eq("clinic_id", member.clinicId)
      .order("created_at", { ascending: false }),
    supabase
      .from("clinic_members")
      .select("user_id, full_name")
      .eq("clinic_id", member.clinicId)
      .eq("status", "active"),
    supabase.from("clinics").select("stale_lead_days").eq("id", member.clinicId).single(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-sm text-muted-foreground">
            Arraste os leads entre as colunas para acompanhar o funil.
          </p>
        </div>
        {canEdit && <LeadFormDialog members={members ?? []} />}
      </div>

      <CrmBoard
        stages={(stages ?? []) as Stage[]}
        leads={(leads ?? []) as Lead[]}
        members={members ?? []}
        staleLeadDays={clinic?.stale_lead_days ?? 3}
        canEdit={canEdit}
      />
    </div>
  );
}
