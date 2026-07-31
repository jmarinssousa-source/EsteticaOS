/**
 * Modelos de mensagem que a clínica manda pelo WhatsApp.
 *
 * Os dois modelos (aniversário e reativação) funcionam igual: um texto
 * com marcações, guardado no navegador de quem manda. É preferência de
 * quem usa, não dado da clínica, e assim não exige tabela nova nem
 * migração. A troca do texto vale para os próximos envios daquela pessoa.
 */

export const BIRTHDAY_TEMPLATE_KEY = "esteticaos:birthday-message";
export const REACTIVATION_TEMPLATE_KEY = "esteticaos:reactivation-message";

export const DEFAULT_BIRTHDAY_MESSAGE =
  "Oi, {nome}! 🎉 Hoje é seu dia e a equipe da {clinica} queria te desejar muitas felicidades. " +
  "Que seu ano seja lindo — e sempre que quiser cuidar de você, a gente está por aqui!";

export const DEFAULT_REACTIVATION_MESSAGE =
  "Oi, {nome}! Tudo bem? Aqui é da {clinica}. " +
  "Faz um tempinho que a gente não se vê e queria saber como você está. " +
  "Quer marcar um horário?";

/** Troca as marcações do modelo pelos dados reais. */
export function renderPatientMessage(
  template: string,
  patientName: string,
  clinicName: string,
): string {
  const firstName = patientName.trim().split(/\s+/)[0];
  return template.replaceAll("{nome}", firstName).replaceAll("{clinica}", clinicName);
}
