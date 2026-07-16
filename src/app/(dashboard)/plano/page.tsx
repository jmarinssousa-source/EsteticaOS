import { requirePermission } from "@/lib/auth/session";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata = { title: "Plano — EstéticaOS" };

export default async function PlanoPage() {
  await requirePermission("settings_access");

  return (
    <PlaceholderPage
      title="Plano"
      description="Gerenciamento de assinatura e cobrança da clínica. Em construção."
    />
  );
}
