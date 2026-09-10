/**
 * Leitura paginada de listas do Supabase.
 *
 * O PostgREST corta toda resposta em 1000 linhas (`db-max-rows`), **sem
 * sinalizar erro**: a consulta volta "com sucesso", só que incompleta. Numa
 * revenda com 3987 parcelas isso fazia o app enxergar só as 1000 de
 * vencimento mais antigo — os contratos das outras 2987 apareciam como
 * "Nenhuma parcela pendente" e não davam para baixar. Bug encontrado em
 * 2026-09-10 a partir de um vídeo do cliente.
 *
 * Toda listagem que pode crescer sem limite conhecido passa por aqui.
 */

/** Linhas por página. Igual ao teto do PostgREST — página menor só multiplica idas ao banco. */
export const TAMANHO_PAGINA = 1000;

/**
 * Trava de segurança: uma consulta que devolvesse página cheia para sempre
 * (bug de filtro, por exemplo) travaria o request. 200 páginas = 200 mil
 * linhas, muito acima de qualquer revenda real.
 */
const MAX_PAGINAS = 200;

type Resposta<T> = { data: T[] | null; error: { message: string } | null };

/**
 * Executa `consultar` em páginas até esgotar a tabela e devolve tudo junto.
 *
 * `consultar` recebe os índices inclusivos da página (o mesmo contrato do
 * `.range(de, ate)` do supabase-js) e deve aplicar sempre a **mesma ordenação**
 * — sem `order` estável, o banco pode repetir ou pular linha entre páginas.
 *
 * Erro em qualquer página estoura: melhor falhar visivelmente do que devolver
 * meia lista, que foi exatamente o modo de falha que originou este helper.
 */
export async function selecionarTudo<T>(
  consultar: (de: number, ate: number) => PromiseLike<Resposta<T>>,
): Promise<T[]> {
  const tudo: T[] = [];

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const de = pagina * TAMANHO_PAGINA;
    const { data, error } = await consultar(de, de + TAMANHO_PAGINA - 1);
    if (error) throw new Error(error.message);

    const lote = data ?? [];
    tudo.push(...lote);
    if (lote.length < TAMANHO_PAGINA) return tudo;
  }

  throw new Error(
    `Leitura paginada passou de ${MAX_PAGINAS} páginas (${MAX_PAGINAS * TAMANHO_PAGINA} linhas) — provável consulta sem filtro.`,
  );
}
