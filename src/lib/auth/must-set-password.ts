import type { User } from "@supabase/supabase-js";

/**
 * Marca, no cadastro do usuário, que ele ainda precisa criar uma senha.
 *
 * Convite entra pelo e-mail, e o e-mail tem dois links: o botão e o
 * endereço para copiar e colar. Se os dois não estiverem exatamente
 * iguais, cada um cria a sessão por um caminho diferente e cai num
 * lugar diferente. Foi o que aconteceu: pelo botão a pessoa entrava
 * direto no painel, sem nunca escolher uma senha, e ficava sem conseguir
 * voltar depois que a sessão expirasse.
 *
 * Por isso a exigência não mora mais no link, mora na conta. O convite
 * grava esta marca; o painel recusa abrir enquanto ela existir; salvar a
 * senha a apaga. Qualquer caminho de entrada acaba na mesma tela.
 *
 * A marca é escrita só nos convites novos. Quem já usa o sistema não
 * tem essa chave e nunca é interrompido.
 */
export const MUST_SET_PASSWORD_KEY = "must_set_password";

/** Metadados enviados ao criar o convite. */
export const INVITE_METADATA = { [MUST_SET_PASSWORD_KEY]: true };

/** Metadados gravados quando a senha finalmente é criada. */
export const PASSWORD_SET_METADATA = { [MUST_SET_PASSWORD_KEY]: false };

export function mustSetPassword(user: Pick<User, "user_metadata"> | null | undefined): boolean {
  return user?.user_metadata?.[MUST_SET_PASSWORD_KEY] === true;
}
