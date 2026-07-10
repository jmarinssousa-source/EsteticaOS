// Deep-links straight into the patient's saved WhatsApp contact (wa.me
// resolves a phone number to its chat) with a pre-filled message — no
// backend integration, just a link the browser/OS hands off to WhatsApp.
export function buildWhatsAppUrl(phone: string | null | undefined, message: string) {
  const digits = phone ? phone.replace(/\D/g, "") : "";
  const withCountryCode = digits ? `55${digits.replace(/^55/, "")}` : "";
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
