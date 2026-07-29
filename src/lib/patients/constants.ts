/**
 * Gênero é guardado como texto livre no banco (cadastros antigos e
 * importações podem trazer qualquer coisa), mas os formulários oferecem
 * estas opções — incluindo "Outro", para quem não se identifica com
 * nenhuma das duas primeiras.
 */
export const GENDER_OPTIONS = ["Feminino", "Masculino", "Outro"] as const;

/** Junta as opções padrão com um valor já gravado que fuja da lista. */
export function genderOptions(current?: string | null) {
  const options = GENDER_OPTIONS.map((label) => ({ value: label, label }));
  if (current && !GENDER_OPTIONS.some((option) => option === current)) {
    return [...options, { value: current, label: current }];
  }
  return options;
}
