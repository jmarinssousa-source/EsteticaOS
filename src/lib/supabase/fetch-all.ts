/**
 * Teto de linhas que o PostgREST devolve numa resposta. É configuração do
 * projeto Supabase (`db-max-rows`, 1000 por padrão) e não vem como erro:
 * a consulta responde 200 com as primeiras mil linhas e nada indica que
 * faltou o resto.
 */
export const POSTGREST_MAX_ROWS = 1000;

/** O mínimo que `fetchAllRows` precisa de uma consulta: saber fatiar e
 *  virar promessa. Tipar assim evita arrastar as generics do
 *  PostgrestFilterBuilder, que mudam de forma a cada versão. */
type RangeableQuery = {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
};

/**
 * Percorre a consulta em blocos até acabar, para varreduras que precisam
 * mesmo da base inteira — conferir duplicados numa importação, montar a
 * lista de reativação. Telas que mostram lista devem paginar de verdade
 * (`.range()` + `count`) em vez de usar isto.
 *
 * `build` é chamado a cada bloco porque o builder do supabase-js é
 * consumido quando vira promessa: reaproveitar a mesma instância traria
 * o primeiro bloco para sempre.
 */
export async function fetchAllRows<T>(
  build: () => RangeableQuery,
  chunkSize = POSTGREST_MAX_ROWS,
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += chunkSize) {
    const { data, error } = await build().range(from, from + chunkSize - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;

    rows.push(...(data as T[]));
    if (data.length < chunkSize) break;
  }

  return rows;
}
